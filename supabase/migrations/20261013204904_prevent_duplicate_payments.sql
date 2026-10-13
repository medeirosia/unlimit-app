-- Archive exact payment copies, then enforce one statement row per payable.
-- Real Balance fields are never assigned by this migration or its functions.
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.financial_repair_archive (
  repair_key text NOT NULL,
  source_table text NOT NULL,
  record_id uuid NOT NULL,
  row_data jsonb NOT NULL,
  reason text NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (repair_key, source_table, record_id)
);
ALTER TABLE private.financial_repair_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.financial_repair_archive FROM PUBLIC, anon, authenticated;

LOCK TABLE public.bank_accounts, public.accounts_payable, public.financial_transactions
  IN SHARE ROW EXCLUSIVE MODE;

DO $cleanup$
DECLARE
  before_balances jsonb;
  after_balances jsonb;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.financial_transactions
    WHERE reference_type = 'payable' AND type = 'payment' AND reference_id IS NOT NULL
    GROUP BY reference_id
    HAVING count(DISTINCT jsonb_build_array(
      user_id, description, amount, from_account_id, to_account_id,
      transaction_date, status, is_platform_withdrawal
    )) > 1
  ) THEN
    RAISE EXCEPTION 'Conflicting payment versions need manual review before deduplication';
  END IF;

  SELECT jsonb_agg(jsonb_build_array(id, balance, real_balance, real_balance_updated_at) ORDER BY id)
    INTO before_balances FROM public.bank_accounts;

  INSERT INTO private.financial_repair_archive (repair_key, source_table, record_id, row_data, reason)
  SELECT 'prevent_duplicate_payments_20261013', 'bank_accounts', id, to_jsonb(b),
    'Balance snapshot before removing exact statement copies'
  FROM public.bank_accounts b
  ON CONFLICT DO NOTHING;

  WITH ranked AS (
    SELECT id, row_number() OVER (PARTITION BY reference_id ORDER BY created_at, id) AS copy_number
    FROM public.financial_transactions
    WHERE reference_type = 'payable' AND type = 'payment' AND reference_id IS NOT NULL
  )
  INSERT INTO private.financial_repair_archive (repair_key, source_table, record_id, row_data, reason)
  SELECT 'prevent_duplicate_payments_20261013', 'financial_transactions', t.id, to_jsonb(t),
    'Exact duplicate of the same payable; oldest statement row retained'
  FROM public.financial_transactions t JOIN ranked r ON r.id = t.id
  WHERE r.copy_number > 1
  ON CONFLICT DO NOTHING;

  DELETE FROM public.financial_transactions t
  USING private.financial_repair_archive a
  WHERE a.repair_key = 'prevent_duplicate_payments_20261013'
    AND a.source_table = 'financial_transactions' AND a.record_id = t.id;

  SELECT jsonb_agg(jsonb_build_array(id, balance, real_balance, real_balance_updated_at) ORDER BY id)
    INTO after_balances FROM public.bank_accounts;
  IF before_balances IS DISTINCT FROM after_balances THEN
    RAISE EXCEPTION 'Removing statement copies unexpectedly changed bank balances';
  END IF;
END;
$cleanup$;

CREATE UNIQUE INDEX IF NOT EXISTS financial_transactions_one_payable_payment
  ON public.financial_transactions (reference_id)
  WHERE reference_type = 'payable' AND type = 'payment' AND reference_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.pay_account_payable(p_payable_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  payable public.accounts_payable%ROWTYPE;
  existing_transaction public.financial_transactions%ROWTYPE;
  account_id uuid;
  transaction_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO payable FROM public.accounts_payable WHERE id = p_payable_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar não encontrada' USING ERRCODE = 'P0002';
  END IF;
  account_id := payable.bank_account_id;
  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Conta de débito é obrigatória' USING ERRCODE = '22023';
  END IF;

  -- All new payment operations lock the bank account before the payable.
  PERFORM 1 FROM public.bank_accounts WHERE id = account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta bancária não encontrada' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO payable FROM public.accounts_payable WHERE id = p_payable_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF payable.bank_account_id IS DISTINCT FROM account_id THEN
    RAISE EXCEPTION 'A conta foi alterada. Atualize a tela e tente novamente'
      USING ERRCODE = '40001';
  END IF;

  SELECT * INTO existing_transaction FROM public.financial_transactions
  WHERE reference_type = 'payable' AND type = 'payment' AND reference_id = p_payable_id;

  IF FOUND AND payable.is_paid AND payable.paid_date IS NOT NULL THEN
    RETURN existing_transaction.id;
  END IF;
  IF existing_transaction.id IS NOT NULL AND (
    existing_transaction.amount IS DISTINCT FROM payable.amount OR
    existing_transaction.from_account_id IS DISTINCT FROM account_id
  ) THEN
    RAISE EXCEPTION 'O pagamento existente tem outros dados. Confira o lançamento'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.accounts_payable
    SET is_paid = true, paid_date = COALESCE(paid_date, due_date), updated_at = now()
    WHERE id = p_payable_id;

  IF existing_transaction.id IS NOT NULL THEN
    RETURN existing_transaction.id;
  END IF;

  INSERT INTO public.financial_transactions (
    user_id, description, amount, type, from_account_id, reference_id, reference_type,
    transaction_date, status
  ) VALUES (
    payable.user_id, 'Pagamento: ' || payable.description, payable.amount, 'payment',
    account_id, payable.id, 'payable', payable.due_date::timestamp AT TIME ZONE 'UTC', 'confirmed'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO transaction_id;

  IF transaction_id IS NULL THEN
    SELECT id INTO transaction_id FROM public.financial_transactions
    WHERE reference_type = 'payable' AND type = 'payment' AND reference_id = p_payable_id;
  END IF;
  IF transaction_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível registrar o pagamento';
  END IF;
  RETURN transaction_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_account_payable(
  p_request_id uuid, p_description text, p_amount numeric, p_category_id uuid,
  p_bank_account_id uuid, p_due_date date, p_pay_immediately boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  account_owner uuid;
  payable public.accounts_payable%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;
  IF p_request_id IS NULL OR p_description IS NULL OR btrim(p_description) = ''
    OR p_amount IS NULL OR p_amount <= 0 OR p_amount <> round(p_amount, 2)
    OR p_category_id IS NULL OR p_bank_account_id IS NULL OR p_due_date IS NULL
    OR p_pay_immediately IS NULL THEN
    RAISE EXCEPTION 'Confira os dados da conta a pagar' USING ERRCODE = '22023';
  END IF;

  SELECT user_id INTO account_owner FROM public.bank_accounts
    WHERE id = p_bank_account_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta bancária não encontrada' USING ERRCODE = 'P0002';
  END IF;

  -- A stable UUID identifies one form submission, including network retries.
  -- Separate submissions with identical descriptions and values remain valid.
  INSERT INTO public.accounts_payable (
    id, user_id, description, amount, category_id, bank_account_id, due_date,
    is_paid, paid_date
  ) VALUES (
    p_request_id, account_owner, btrim(p_description), p_amount, p_category_id,
    p_bank_account_id, p_due_date, false, NULL
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO payable FROM public.accounts_payable WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conta a pagar não encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF payable.description IS DISTINCT FROM btrim(p_description)
    OR payable.amount IS DISTINCT FROM p_amount
    OR payable.category_id IS DISTINCT FROM p_category_id
    OR payable.bank_account_id IS DISTINCT FROM p_bank_account_id
    OR payable.due_date IS DISTINCT FROM p_due_date
    OR payable.user_id IS DISTINCT FROM account_owner THEN
    RAISE EXCEPTION 'Este envio já foi registrado com outros dados. Atualize a tela para conferir'
      USING ERRCODE = '22023';
  END IF;

  IF p_pay_immediately THEN
    PERFORM public.pay_account_payable(payable.id);
  END IF;
  RETURN payable.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.undo_account_payable_payment(p_transaction_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  payment public.financial_transactions%ROWTYPE;
  payable_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO payment FROM public.financial_transactions
    WHERE id = p_transaction_id AND type = 'payment' AND reference_type = 'payable';
  IF NOT FOUND THEN RETURN false; END IF;
  payable_id := payment.reference_id;

  PERFORM 1 FROM public.bank_accounts WHERE id = payment.from_account_id FOR UPDATE;
  PERFORM 1 FROM public.accounts_payable WHERE id = payable_id FOR UPDATE;

  -- An old browser tab may still show a removed copy. Never reopen its original payment.
  SELECT * INTO payment FROM public.financial_transactions
    WHERE id = p_transaction_id AND reference_id = payable_id
      AND type = 'payment' AND reference_type = 'payable' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE public.accounts_payable
    SET is_paid = false, paid_date = NULL, updated_at = now()
    WHERE id = payable_id;
  DELETE FROM public.financial_transactions
    WHERE reference_id = payable_id AND type = 'payment' AND reference_type = 'payable';
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.pay_account_payable(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_account_payable(uuid, text, numeric, uuid, uuid, date, boolean)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.undo_account_payable_payment(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_account_payable(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_account_payable(uuid, text, numeric, uuid, uuid, date, boolean)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_account_payable_payment(uuid) TO authenticated;
