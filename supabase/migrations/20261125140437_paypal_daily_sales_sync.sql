-- PayPal D-1: zero opening balance confirmed by the owner on 2026-11-25.
-- This integration never sets bank_accounts.real_balance or its timestamp.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table private.paypal_sync_config (
  account_id uuid primary key references public.bank_accounts(id),
  first_import_date date not null,
  opening_balance numeric(12,2) not null check (opening_balance = 0),
  enabled boolean not null default false,
  cron_token_hash text,
  activated_at timestamptz,
  constraint paypal_sync_one_account check (account_id = '8cb28ca7-95f3-4e93-9305-33c2d7771935'::uuid)
);
create table private.paypal_sales_imports (
  account_id uuid not null references private.paypal_sync_config(account_id),
  source_transaction_id text not null check (length(source_transaction_id) between 1 and 100),
  sale_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  source_snapshot jsonb not null,
  receivable_id uuid not null unique references public.accounts_receivable(id),
  transaction_id uuid not null unique references public.financial_transactions(id),
  imported_at timestamptz not null default now(),
  primary key (account_id, source_transaction_id)
);
create index paypal_sales_imports_day_idx on private.paypal_sales_imports(account_id, sale_date);
create table private.paypal_sync_days (
  account_id uuid not null references private.paypal_sync_config(account_id),
  sale_date date not null,
  sales_count integer not null,
  total_net_brl numeric(12,2) not null,
  provider_refreshed_at timestamptz not null,
  checked_at timestamptz not null default now(),
  primary key (account_id, sale_date)
);
create table private.paypal_sync_runs (
  id bigint generated always as identity primary key,
  sale_date date,
  status text not null check (status in ('completed','failed')),
  new_sales integer,
  error_code text,
  created_at timestamptz not null default now()
);
alter table private.paypal_sync_config enable row level security;
alter table private.paypal_sales_imports enable row level security;
alter table private.paypal_sync_days enable row level security;
alter table private.paypal_sync_runs enable row level security;
revoke all on private.paypal_sync_config, private.paypal_sales_imports, private.paypal_sync_days, private.paypal_sync_runs from public, anon, authenticated;
grant usage on schema private to service_role;
grant select on private.paypal_sync_config to service_role;
grant select, insert on private.paypal_sales_imports, private.paypal_sync_runs to service_role;
grant select, insert, update on private.paypal_sync_days to service_role;
grant usage, select on sequence private.paypal_sync_runs_id_seq to service_role;

do $$
begin
  if not exists (select 1 from public.bank_accounts where id='8cb28ca7-95f3-4e93-9305-33c2d7771935' and name='PayPal' and active and coalesce(initial_balance,0)=0 and balance=0)
     or exists (select 1 from public.accounts_receivable where bank_account_id='8cb28ca7-95f3-4e93-9305-33c2d7771935')
     or exists (select 1 from public.financial_transactions where from_account_id='8cb28ca7-95f3-4e93-9305-33c2d7771935' or to_account_id='8cb28ca7-95f3-4e93-9305-33c2d7771935') then
    raise exception 'PAYPAL_OPENING_REQUIRES_REVIEW';
  end if;
  insert into private.paypal_sync_config(account_id, first_import_date, opening_balance)
    select id, date '2026-11-24', 0 from public.bank_accounts where id='8cb28ca7-95f3-4e93-9305-33c2d7771935';
end $$;

create function public.paypal_sync_authorize(p_token text) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(select 1 from private.paypal_sync_config where enabled and cron_token_hash=encode(extensions.digest(p_token,'sha256'),'hex'));
$$;

create function public.paypal_sync_plan() returns jsonb
language sql stable security invoker set search_path='' as $$
  with cfg as (select * from private.paypal_sync_config),
  candidates as (
    select d::date sale_date from cfg, pg_catalog.generate_series(cfg.first_import_date::timestamp, ((now() at time zone 'America/Fortaleza')::date-1)::timestamp, interval '1 day') d
    where d::date >= (now() at time zone 'America/Fortaleza')::date-90
      and (d::date >= (now() at time zone 'America/Fortaleza')::date-3 or not exists(select 1 from private.paypal_sync_days s where s.account_id=cfg.account_id and s.sale_date=d::date))
    order by d limit 7
  )
  select jsonb_build_object('enabled',cfg.enabled,'first_import_date',cfg.first_import_date,'opening_balance',cfg.opening_balance,
    'timezone','America/Fortaleza','scheduled_local_time','09:00','dates',coalesce((select jsonb_agg(sale_date order by sale_date) from candidates),'[]'::jsonb),
    'balance',a.balance,'real_balance',a.real_balance,
    'unrecoverable_gap',exists(select 1 from pg_catalog.generate_series(cfg.first_import_date::timestamp, ((now() at time zone 'America/Fortaleza')::date-91)::timestamp, interval '1 day') d where not exists(select 1 from private.paypal_sync_days s where s.account_id=cfg.account_id and s.sale_date=d::date)),
    'last_run',(select to_jsonb(r) from private.paypal_sync_runs r order by r.id desc limit 1))
  from cfg join public.bank_accounts a on a.id=cfg.account_id;
$$;

create function public.paypal_sync_record_failure(p_date date, p_code text) returns void
language sql security invoker set search_path='' as $$
  insert into private.paypal_sync_runs(sale_date,status,error_code) values(p_date,'failed',case when p_code ~ '^[A-Z0-9_]{1,80}$' then p_code else 'SYNC_UNAVAILABLE' end);
$$;

create function public.paypal_sync_post_day(p_report jsonb) returns jsonb
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
  select id into v_category from public.receivable_categories where user_id=a.user_id and name='Recebimentos' order by id limit 1;
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
         or not exists(select 1 from public.accounts_receivable r where r.id=prev.receivable_id and r.user_id=a.user_id and r.bank_account_id=a.id and r.amount=prev.amount and r.is_received and r.due_date=v_day and r.received_date=v_day)
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

-- Private, tightly scoped scheduler credential; no project-wide key in pg_net.
create function private.paypal_sync_dispatch() returns bigint
language plpgsql security definer set search_path='' as $$
declare v_token text;
begin
  if not exists(select 1 from private.paypal_sync_config where enabled) then return null; end if;
  select decrypted_secret into strict v_token from vault.decrypted_secrets where name='unlimit_paypal_sync_token';
  return net.http_post(url:='https://uyzibbtejyqdfqlktlwd.supabase.co/functions/v1/paypal-daily-sync',
    headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_token),body:='{}'::jsonb,timeout_milliseconds:=120000);
end;
$$;
create function private.paypal_sync_activate() returns jsonb
language plpgsql security definer set search_path='' as $$
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
  return jsonb_build_object('enabled',true,'scheduled_local_time','09:00','timezone','America/Fortaleza');
end;
$$;
create function public.paypal_sync_activate() returns jsonb
language sql security invoker set search_path='' as $$ select private.paypal_sync_activate(); $$;

revoke all on function private.paypal_sync_dispatch(), private.paypal_sync_activate() from public,anon,authenticated;
grant execute on function private.paypal_sync_activate() to service_role;
revoke all on function public.paypal_sync_authorize(text),public.paypal_sync_plan(),public.paypal_sync_record_failure(date,text),public.paypal_sync_post_day(jsonb),public.paypal_sync_activate() from public,anon,authenticated;
grant execute on function public.paypal_sync_authorize(text),public.paypal_sync_plan(),public.paypal_sync_record_failure(date,text),public.paypal_sync_post_day(jsonb),public.paypal_sync_activate() to service_role;
-- pg_net is internal only; callers cannot inspect its transient bearer header.
revoke all on all tables in schema net from public,anon,authenticated;
