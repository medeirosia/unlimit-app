-- Run as an administrative SQL test. All synthetic rows are rolled back.
begin;
do $test$
declare
  cfg private.paypal_sync_config%rowtype;
  a public.bank_accounts%rowtype;
  v_day date;
  v_id text := 'UNIT-PACIFIC-'||replace(gen_random_uuid()::text,'-','');
  v_at timestamptz;
  v_sales jsonb;
  v_transactions jsonb;
  v_total numeric;
  v_report jsonb;
  v_result jsonb;
  v_manual jsonb;
  v_after jsonb;
  v_error text;
begin
  select * into strict cfg from private.paypal_sync_config;
  select * into strict a from public.bank_accounts where id=cfg.account_id for update;
  v_day:=cfg.first_import_date;
  -- Late Pacific sale: next calendar day in Fortaleza, still v_day in PayPal.
  v_at:=((v_day+1)::timestamp at time zone 'America/Los_Angeles')-interval '1 minute';
  select jsonb_agg(jsonb_build_array(id,real_balance,real_balance_updated_at) order by id)
    into v_manual from public.bank_accounts;
  select coalesce(jsonb_agg(source_snapshot->'sale' order by source_transaction_id),'[]'::jsonb),
    coalesce(jsonb_agg(jsonb_build_object('transaction_id',source_transaction_id,
      'initiated_at',source_snapshot->>'initiated_at','event_code',source_snapshot->>'event_code')
      order by source_transaction_id),'[]'::jsonb),coalesce(sum(amount),0)
    into v_sales,v_transactions,v_total
    from private.paypal_sales_imports where account_id=a.id and sale_date=v_day;
  v_sales:=v_sales||jsonb_build_array(jsonb_build_object(
    'source_transaction_id',v_id,'source_currency','BRL','source_gross','10.00',
    'source_fee','0.00','source_net','10.00','net_brl','10.00',
    'fees_already_deducted',true,'conversion_transaction_ids','[]'::jsonb));
  v_transactions:=v_transactions||jsonb_build_array(jsonb_build_object(
    'transaction_id',v_id,'initiated_at',v_at,'event_code','T0006'));
  v_report:=jsonb_build_object('ok',true,'environment','live','mode','read_only_preview',
    'account_id',a.id,'timezone','America/Los_Angeles','date',v_day,
    'start',v_day::timestamp at time zone 'America/Los_Angeles',
    'end_exclusive',(v_day+1)::timestamp at time zone 'America/Los_Angeles',
    'provider_refreshed_through_day_end',true,'provider_last_refreshed_at',now(),
    'warnings','[]'::jsonb,'transactions',v_transactions,'reconciled_sales',
    jsonb_build_object('unmatched_successful_records',0,
      'posting_basis','PROVIDER_NET_BRL_NO_SECOND_FEE_DEDUCTION',
      'count',jsonb_array_length(v_sales),'total_net_brl',to_char(v_total+10,'FM9999999990.00'),
      'sales',v_sales));

  v_result:=public.paypal_sync_post_day(v_report);
  if (v_result->>'new_sales')::int<>1 then raise exception 'TEST_NEW_SALE_FAILED'; end if;
  v_result:=public.paypal_sync_post_day(v_report);
  if (v_result->>'new_sales')::int<>0 then raise exception 'TEST_REPEAT_DUPLICATED'; end if;
  if not exists(select 1 from private.paypal_sales_imports i
    join public.financial_transactions t on t.id=i.transaction_id
    join public.accounts_receivable r on r.id=i.receivable_id
    join public.receivable_categories c on c.id=r.category_id
    where i.account_id=a.id and i.source_transaction_id=v_id and i.sale_date=v_day
      and i.amount=10 and r.amount=10 and t.amount=10 and c.name='Low-Tickets LATAM'
      and r.received_date=v_day and r.due_date=v_day
      and t.transaction_date=(v_day::timestamp at time zone 'UTC')
      and (i.source_snapshot->>'initiated_at')::timestamptz=v_at) then
    raise exception 'TEST_PACIFIC_DATE_OR_CATEGORY_FAILED';
  end if;
  if (select balance from public.bank_accounts where id=a.id)<>a.balance+10 then
    raise exception 'TEST_BALANCE_NOT_EXACTLY_ONE_NET_SALE';
  end if;
  select jsonb_agg(jsonb_build_array(id,real_balance,real_balance_updated_at) order by id)
    into v_after from public.bank_accounts;
  if v_after is distinct from v_manual then raise exception 'TEST_MANUAL_BALANCE_CHANGED'; end if;

  begin
    perform public.paypal_sync_post_day(v_report||jsonb_build_object('timezone','America/Fortaleza'));
    raise exception 'TEST_LEGACY_CUTOFF_ACCEPTED';
  exception when others then
    get stacked diagnostics v_error=message_text;
    if v_error<>'PAYPAL_UNRECONCILED_REPORT' then raise; end if;
  end;
  begin
    perform public.paypal_sync_post_day(v_report||jsonb_build_object('end_exclusive',now()));
    raise exception 'TEST_WRONG_BOUNDARY_ACCEPTED';
  exception when others then
    get stacked diagnostics v_error=message_text;
    if v_error<>'PAYPAL_REPORT_CUTOFF_MISMATCH' then raise; end if;
  end;
end;
$test$;
select 'passed: Pacific date, category, one net receipt, repeat, cutoff guards, manual fields' as verification;
rollback;
