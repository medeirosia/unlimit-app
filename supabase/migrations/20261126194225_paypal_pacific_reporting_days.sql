-- Owner-approved PayPal reporting calendar (Pacific PST/PDT), D-1 only.
-- Schedule execution remains 09:00 America/Fortaleza. No artificial balance
-- adjustment and no manual Saldo Real field is changed by this migration.
-- All financial writes are scoped through the existing integration config.
do $migration$
declare
  cfg private.paypal_sync_config%rowtype;
  a public.bank_accounts%rowtype;
  v_manual_before jsonb;
  v_manual_after jsonb;
  v_balance_after numeric;
begin
  select * into strict cfg from private.paypal_sync_config for update;
  select * into strict a from public.bank_accounts where id=cfg.account_id for update;
  select jsonb_agg(jsonb_build_array(id,real_balance,real_balance_updated_at) order by id)
    into v_manual_before from public.bank_accounts;
  -- Stop if any legacy posting would need an unreviewed day/amount/source change.
  if exists (
    select 1 from private.paypal_sales_imports i
    left join public.accounts_receivable r on r.id=i.receivable_id
    left join public.financial_transactions t on t.id=i.transaction_id
    where i.account_id=cfg.account_id and (
      i.sale_date is distinct from ((i.source_snapshot->>'initiated_at')::timestamptz at time zone 'America/Los_Angeles')::date
      or r.id is null or r.bank_account_id is distinct from a.id or r.user_id is distinct from a.user_id
      or r.amount is distinct from i.amount or r.is_received is distinct from true
      or r.due_date is distinct from i.sale_date or r.received_date is distinct from i.sale_date
      or t.id is null or t.to_account_id is distinct from a.id or t.user_id is distinct from a.user_id
      or t.from_account_id is not null or t.amount is distinct from i.amount
      or t.type is distinct from 'receipt' or t.reference_type is distinct from 'receivable'
      or t.reference_id is distinct from r.id or coalesce(t.status,'confirmed')<>'confirmed'
      or t.transaction_date is distinct from (i.source_snapshot->>'initiated_at')::timestamptz
    )
  ) then raise exception 'PAYPAL_PACIFIC_LEGACY_RECORD_REQUIRES_REVIEW'; end if;

  insert into private.financial_repair_archive(repair_key,source_table,record_id,row_data,reason)
    select 'paypal-pacific-calendar-2026-11-26','public.financial_transactions',t.id,to_jsonb(t),
      'Book on PayPal calendar date; original provider instant remains in source mapping'
    from public.financial_transactions t join private.paypal_sales_imports i on i.transaction_id=t.id
    where i.account_id=cfg.account_id;
  insert into private.financial_repair_archive(repair_key,source_table,record_id,row_data,reason)
    select 'paypal-pacific-calendar-2026-11-26:'||d.sale_date,'private.paypal_sync_days',d.account_id,to_jsonb(d),
      'Legacy Fortaleza closing check; requery the complete PayPal Pacific day'
    from private.paypal_sync_days d where d.account_id=cfg.account_id;

  update public.financial_transactions t
    set transaction_date=i.sale_date::timestamp at time zone 'UTC'
    from private.paypal_sales_imports i
    where i.account_id=cfg.account_id and t.id=i.transaction_id
      and t.transaction_date is distinct from (i.sale_date::timestamp at time zone 'UTC');
  -- Keep all source mappings/receipts; only invalidate old timezone day checks.
  delete from private.paypal_sync_days where account_id=cfg.account_id;
  select balance into v_balance_after from public.bank_accounts where id=a.id;
  select jsonb_agg(jsonb_build_array(id,real_balance,real_balance_updated_at) order by id)
    into v_manual_after from public.bank_accounts;
  if v_balance_after is distinct from a.balance or v_manual_after is distinct from v_manual_before then
    raise exception 'PAYPAL_PACIFIC_MIGRATION_CHANGED_BALANCE';
  end if;
end;
$migration$;

CREATE OR REPLACE FUNCTION public.paypal_sync_plan()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with cfg as (select * from private.paypal_sync_config),
  candidates as (
    select d::date sale_date from cfg, pg_catalog.generate_series(cfg.first_import_date::timestamp, ((now() at time zone 'America/Los_Angeles')::date-1)::timestamp, interval '1 day') d
    where d::date >= (now() at time zone 'America/Los_Angeles')::date-90
      and (d::date >= (now() at time zone 'America/Los_Angeles')::date-3 or not exists(select 1 from private.paypal_sync_days s where s.account_id=cfg.account_id and s.sale_date=d::date))
    order by d limit 7
  )
  select jsonb_build_object('enabled',cfg.enabled,'first_import_date',cfg.first_import_date,'opening_balance',cfg.opening_balance,
    'timezone','America/Los_Angeles','scheduled_local_time','09:00','scheduled_timezone','America/Fortaleza','dates',coalesce((select jsonb_agg(sale_date order by sale_date) from candidates),'[]'::jsonb),
    'balance',a.balance,'real_balance',a.real_balance,
    'unrecoverable_gap',exists(select 1 from pg_catalog.generate_series(cfg.first_import_date::timestamp, ((now() at time zone 'America/Los_Angeles')::date-91)::timestamp, interval '1 day') d where not exists(select 1 from private.paypal_sync_days s where s.account_id=cfg.account_id and s.sale_date=d::date)),
    'last_run',(select to_jsonb(r) from private.paypal_sync_runs r order by r.id desc limit 1))
  from cfg join public.bank_accounts a on a.id=cfg.account_id;
$function$
;

CREATE OR REPLACE FUNCTION public.paypal_sync_post_day(p_report jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  v_book_at timestamptz;
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
     or p_report->>'timezone' is distinct from 'America/Los_Angeles'
     or p_report->>'provider_refreshed_through_day_end' is distinct from 'true'
     or p_report->'warnings' is distinct from '[]'::jsonb
     or p_report#>>'{reconciled_sales,unmatched_successful_records}' is distinct from '0'
     or p_report#>>'{reconciled_sales,posting_basis}' is distinct from 'PROVIDER_NET_BRL_NO_SECOND_FEE_DEDUCTION'
     or jsonb_typeof(p_report#>'{reconciled_sales,sales}') is distinct from 'array'
     or (p_report->>'date') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'PAYPAL_UNRECONCILED_REPORT';
  end if;
  v_day := (p_report->>'date')::date;
  -- Date-only booking follows the app's UTC-midnight convention. The actual
  -- provider timestamp is retained unchanged in source_snapshot.initiated_at.
  v_book_at := v_day::timestamp at time zone 'UTC';
  if v_day is null or v_day<cfg.first_import_date or v_day>=(now() at time zone 'America/Los_Angeles')::date
     or v_day<(now() at time zone 'America/Los_Angeles')::date-90
     or (p_report->>'provider_last_refreshed_at') is null
     or (p_report->>'provider_last_refreshed_at')::timestamptz < ((v_day+1)::timestamp at time zone 'America/Los_Angeles') then
    raise exception 'PAYPAL_INVALID_CLOSED_DAY';
  end if;
  if (p_report->>'start')::timestamptz is distinct from (v_day::timestamp at time zone 'America/Los_Angeles')
     or (p_report->>'end_exclusive')::timestamptz is distinct from ((v_day+1)::timestamp at time zone 'America/Los_Angeles') then
    raise exception 'PAYPAL_REPORT_CUTOFF_MISMATCH';
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
    if v_at is null or v_event is null or (v_at at time zone 'America/Los_Angeles')::date<>v_day or v_event not in ('T0002','T0003','T0005','T0006','T0007','T0011','T0012','T0018') then
      raise exception 'PAYPAL_SALE_DATE_OR_TYPE_MISMATCH';
    end if;
    v_sale:=v_sale || jsonb_build_object('conversion_transaction_ids',(select coalesce(jsonb_agg(value order by value),'[]'::jsonb) from jsonb_array_elements(v_sale->'conversion_transaction_ids')));
    v_snapshot:=jsonb_build_object('sale',v_sale,'initiated_at',v_at,'event_code',v_event);
    select * into prev from private.paypal_sales_imports where account_id=a.id and source_transaction_id=v_source;
    if found then
      if prev.sale_date<>v_day or prev.amount<>v_amount or prev.source_snapshot<>v_snapshot
         or not exists(select 1 from public.accounts_receivable r where r.id=prev.receivable_id and r.user_id=a.user_id and r.bank_account_id=a.id and r.category_id=v_category and r.amount=prev.amount and r.is_received and r.due_date=v_day and r.received_date=v_day)
         or not exists(select 1 from public.financial_transactions t where t.id=prev.transaction_id and t.user_id=a.user_id and t.type='receipt' and t.to_account_id=a.id and t.from_account_id is null and t.amount=prev.amount and t.reference_id=prev.receivable_id and t.reference_type='receivable' and t.transaction_date=v_book_at and coalesce(t.status,'confirmed')='confirmed') then
        raise exception 'PAYPAL_IMPORTED_SALE_CHANGED';
      end if;
    else
      insert into public.accounts_receivable(user_id,description,amount,bank_account_id,due_date,received_date,is_received,category_id)
        values(a.user_id,'Venda PayPal líquida · '||to_char(v_day,'DD/MM/YYYY')||' · '||v_source,v_amount,a.id,v_day,v_day,true,v_category) returning id into v_receivable;
      insert into public.financial_transactions(user_id,description,amount,type,to_account_id,reference_id,reference_type,transaction_date,status)
        values(a.user_id,'Recebimento: PayPal líquido · '||v_source,v_amount,'receipt',a.id,v_receivable,'receivable',v_book_at,'confirmed') returning id into v_transaction;
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
$function$
;

CREATE OR REPLACE FUNCTION private.paypal_sync_activate()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_token text;
begin
  perform 1 from private.paypal_sync_config for update;
  select decrypted_secret into v_token from vault.decrypted_secrets where name='unlimit_paypal_sync_token';
  if v_token is null then
    v_token:='paypal_sync_'||encode(extensions.gen_random_bytes(32),'hex');
    perform vault.create_secret(v_token,'unlimit_paypal_sync_token','Scoped only to the Unlimit PayPal sales scheduler');
  end if;
  update private.paypal_sync_config set enabled=true,cron_token_hash=encode(extensions.digest(v_token,'sha256'),'hex'),activated_at=coalesce(activated_at,now());
  perform cron.schedule('unlimit-paypal-daily-d1','0 12 * * *','select private.paypal_sync_dispatch();');
  return jsonb_build_object('enabled',true,'scheduled_local_time','09:00','timezone','America/Los_Angeles','scheduled_timezone','America/Fortaleza');
end;
$function$
;

-- CREATE OR REPLACE preserves existing service-only execute grants. No public
-- table, policy, credential or authorization grant is added here.
