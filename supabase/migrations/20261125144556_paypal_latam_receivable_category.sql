-- Required owner category for future imports, plus category-only historical backfill.
-- Version matches the hosted migration history.
create or replace function public.paypal_sync_post_day(p_report jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  cfg private.paypal_sync_config%rowtype;
  a public.bank_accounts%rowtype;
  v_day date;
  v_sale jsonb;
  v_source text;
  v_amount numeric(12,2);
  v_total numeric(12,2):=0;
  v_count integer:=0;
  v_new integer:=0;
  v_receivable uuid;
  v_transaction uuid;
  v_category uuid;
  v_at timestamptz;
  v_event text;
  v_snapshot jsonb;
  prev private.paypal_sales_imports%rowtype;
  v_ids text[] := array[]::text[];
  v_real_after numeric;
  v_real_time_after timestamptz;
begin
  select * into strict cfg from private.paypal_sync_config;
  if not cfg.enabled then raise exception 'PAYPAL_IMPORT_DISABLED'; end if;
  -- Account lock serializes overlapping schedules/retries before any money writes.
  select * into strict a from public.bank_accounts where id=cfg.account_id for update;
  if not a.active or coalesce(a.initial_balance,0)<>cfg.opening_balance then raise exception 'PAYPAL_BASELINE_CHANGED'; end if;
  if jsonb_typeof(p_report)<>'object' or p_report->>'ok' is distinct from 'true'
     or p_report->>'environment' is distinct from 'live'
     or p_report->>'mode' is distinct from 'read_only_preview'
     or p_report->>'account_id' is distinct from cfg.account_id::text
     or p_report->>'timezone' is distinct from 'America/Fortaleza'
     or p_report->>'provider_refreshed_through_day_end' is distinct from 'true'
     or p_report->'warnings' is distinct from '[]'::jsonb
     or p_report#>>'{reconciled_sales,unmatched_successful_records}' is distinct from '0'
     or p_report#>>'{reconciled_sales,posting_basis}' is distinct from 'PROVIDER_NET_BRL_NO_SECOND_FEE_DEDUCTION'
     or jsonb_typeof(p_report#>'{reconciled_sales,sales}') is distinct from 'array'
     or (p_report->>'date') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'PAYPAL_UNRECONCILED_REPORT';
  end if;
  v_day := (p_report->>'date')::date;
  if v_day is null or v_day<cfg.first_import_date or v_day>=(now() at time zone 'America/Fortaleza')::date
     or v_day<(now() at time zone 'America/Fortaleza')::date-90
     or (p_report->>'provider_last_refreshed_at') is null
     or (p_report->>'provider_last_refreshed_at')::timestamptz < ((v_day+1)::timestamp at time zone 'America/Fortaleza') then
    raise exception 'PAYPAL_INVALID_CLOSED_DAY';
  end if;
  -- Never guess whether a manually entered sale is the same as an API sale.
  if exists(select 1 from public.accounts_receivable r where r.bank_account_id=a.id and not exists(select 1 from private.paypal_sales_imports i where i.receivable_id=r.id)) then
    raise exception 'PAYPAL_MANUAL_RECEIPTS_REQUIRE_REVIEW';
  end if;
  select id into v_category from public.receivable_categories where user_id=a.user_id and name='Low-Tickets LATAM' order by id limit 1;
  if v_category is null or (select count(*) from public.receivable_categories where user_id=a.user_id and name='Low-Tickets LATAM')<>1 then raise exception 'PAYPAL_LATAM_CATEGORY_REQUIRES_REVIEW'; end if;
  for v_sale in select value from jsonb_array_elements(p_report#>'{reconciled_sales,sales}') loop
    v_source:=v_sale->>'source_transaction_id';
    if v_source is null or v_source !~ '^[A-Za-z0-9_-]{1,100}$' or v_source=any(v_ids)
       or (v_sale->>'net_brl') is null or (v_sale->>'net_brl') !~ '^\d+\.\d{2}$'
       or v_sale->>'fees_already_deducted' is distinct from 'true'
       or jsonb_typeof(v_sale->'conversion_transaction_ids') is distinct from 'array' then
      raise exception 'PAYPAL_INVALID_SALE';
    end if;
    v_ids:=array_append(v_ids,v_source);
    v_amount:=(v_sale->>'net_brl')::numeric;
    if v_amount<=0 then raise exception 'PAYPAL_INVALID_AMOUNT'; end if;
    select (t->>'initiated_at')::timestamptz,t->>'event_code' into strict v_at,v_event from jsonb_array_elements(p_report->'transactions') t where t->>'transaction_id'=v_source;
    if v_at is null or v_event is null or (v_at at time zone 'America/Fortaleza')::date<>v_day or v_event not in ('T0002','T0003','T0005','T0006','T0007','T0011','T0012','T0018') then
      raise exception 'PAYPAL_SALE_DATE_OR_TYPE_MISMATCH';
    end if;
    v_sale:=v_sale || jsonb_build_object('conversion_transaction_ids',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from jsonb_array_elements(v_sale->'conversion_transaction_ids')));
    v_snapshot:=jsonb_build_object('sale',v_sale,'initiated_at',v_at,'event_code',v_event);
    select * into prev from private.paypal_sales_imports where account_id=a.id and source_transaction_id=v_source;
    if found then
      if prev.sale_date<>v_day or prev.amount<>v_amount or prev.source_snapshot<>v_snapshot
         or not exists(select 1 from public.accounts_receivable r where r.id=prev.receivable_id and r.user_id=a.user_id and r.bank_account_id=a.id and r.category_id=v_category and r.amount=prev.amount and r.is_received and r.due_date=v_day and r.received_date=v_day)
         or not exists(select 1 from public.financial_transactions t where t.id=prev.transaction_id and t.user_id=a.user_id and t.type='receipt' and t.to_account_id=a.id and t.from_account_id is null and t.amount=prev.amount and t.reference_id=prev.receivable_id and t.reference_type='receivable' and t.transaction_date=v_at and coalesce(t.status,'confirmed')='confirmed') then
        raise exception 'PAYPAL_IMPORTED_SALE_CHANGED';
      end if;
    else
      insert into public.accounts_receivable(user_id,description,amount,bank_account_id,due_date,received_date,is_received,category_id)
        values(a.user_id,'Venda PayPal líquida · '||to_char(v_day,'DD/MM/YYYY')||' · '||v_source,v_amount,a.id,v_day,v_day,true,v_category) returning id into v_receivable;
      insert into public.financial_transactions(user_id,description,amount,type,to_account_id,reference_id,reference_type,transaction_date,status)
        values(a.user_id,'Recebimento: PayPal líquido · '||v_source,v_amount,'receipt',a.id,v_receivable,'receivable',v_at,'confirmed') returning id into v_transaction;
      insert into private.paypal_sales_imports(account_id,source_transaction_id,sale_date,amount,source_snapshot,receivable_id,transaction_id)
        values(a.id,v_source,v_day,v_amount,v_snapshot,v_receivable,v_transaction);
      v_new:=v_new+1;
    end if;
    v_count:=v_count+1;
    v_total:=v_total+v_amount;
  end loop;
  if exists(select 1 from private.paypal_sales_imports where account_id=a.id and sale_date=v_day and not (source_transaction_id=any(v_ids))) then raise exception 'PAYPAL_PREVIOUS_SALE_MISSING'; end if;
  if v_count is distinct from (p_report#>>'{reconciled_sales,count}')::integer
     or v_total is distinct from (p_report#>>'{reconciled_sales,total_net_brl}')::numeric then raise exception 'PAYPAL_REPORT_TOTAL_MISMATCH'; end if;
  select real_balance,real_balance_updated_at into v_real_after,v_real_time_after from public.bank_accounts where id=a.id;
  if v_real_after is distinct from a.real_balance or v_real_time_after is distinct from a.real_balance_updated_at then raise exception 'PAYPAL_MANUAL_BALANCE_CHANGED'; end if;
  insert into private.paypal_sync_days(account_id,sale_date,sales_count,total_net_brl,provider_refreshed_at)
    values(a.id,v_day,v_count,v_total,(p_report->>'provider_last_refreshed_at')::timestamptz)
    on conflict(account_id,sale_date) do update set sales_count=excluded.sales_count,total_net_brl=excluded.total_net_brl,provider_refreshed_at=excluded.provider_refreshed_at,checked_at=now();
  insert into private.paypal_sync_runs(sale_date,status,new_sales) values(v_day,'completed',v_new);
  return jsonb_build_object('date',v_day,'sales_count',v_count,'net_brl',v_total,'new_sales',v_new,'already_imported',v_count-v_new,'real_balance_untouched',true);
end;
$$;

-- Reclassify existing PayPal receipts only; retain a private rollback archive.
do $repair$
declare
 a public.bank_accounts%rowtype;
 v_category uuid;
 v_count integer;
 v_before jsonb;
 v_after jsonb;
 r_before jsonb;
 r_after jsonb;
 t_before jsonb;
 t_after jsonb;
begin
 select b.* into strict a from public.bank_accounts b join private.paypal_sync_config cfg on cfg.account_id=b.id for update of b;
 select count(*) into v_count from public.receivable_categories where user_id=a.user_id and name='Low-Tickets LATAM';
 if v_count<>1 then raise exception 'PAYPAL_LATAM_CATEGORY_REQUIRES_REVIEW'; end if;
 select id into strict v_category from public.receivable_categories where user_id=a.user_id and name='Low-Tickets LATAM';
 v_before:=to_jsonb(a)-'updated_at';
 select coalesce(jsonb_agg((to_jsonb(r)-'category_id'-'updated_at') order by r.id),'[]'::jsonb) into r_before from public.accounts_receivable r where r.bank_account_id=a.id;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) into t_before from public.financial_transactions t where t.from_account_id=a.id or t.to_account_id=a.id;
 insert into private.financial_repair_archive(repair_key,source_table,record_id,row_data,reason)
 select 'paypal_latam_category_20261125','accounts_receivable',r.id,to_jsonb(r),'Owner requested Low-Tickets LATAM for all PayPal sales; category only'
 from public.accounts_receivable r where r.bank_account_id=a.id and r.user_id=a.user_id and r.category_id is distinct from v_category
   and not exists(select 1 from private.financial_repair_archive f where f.repair_key='paypal_latam_category_20261125' and f.source_table='accounts_receivable' and f.record_id=r.id);
 update public.accounts_receivable set category_id=v_category,updated_at=now() where bank_account_id=a.id and user_id=a.user_id and category_id is distinct from v_category;
 select to_jsonb(b)-'updated_at' into v_after from public.bank_accounts b where id=a.id;
 select coalesce(jsonb_agg((to_jsonb(r)-'category_id'-'updated_at') order by r.id),'[]'::jsonb) into r_after from public.accounts_receivable r where r.bank_account_id=a.id;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) into t_after from public.financial_transactions t where t.from_account_id=a.id or t.to_account_id=a.id;
 if v_after is distinct from v_before or r_after is distinct from r_before or t_after is distinct from t_before then raise exception 'PAYPAL_CATEGORY_ONLY_INTEGRITY_FAILED'; end if;
end $repair$;
revoke all on function public.paypal_sync_post_day(jsonb) from public,anon,authenticated;
grant execute on function public.paypal_sync_post_day(jsonb) to service_role;
