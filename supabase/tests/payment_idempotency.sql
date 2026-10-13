-- Financial regression checks. All test records and balance changes are rolled back.
BEGIN;
SELECT set_config('request.jwt.claim.sub', 'b5007d28-0311-4cc6-ae08-4a5b7c8cba34', true);
SET LOCAL ROLE authenticated;
DO $tests$
DECLARE
  card_id uuid := '5b438d83-1452-4414-9d2c-9cb8bbdbee3a';
  category_id uuid := '9a7b754e-ace5-4a44-8e60-a41e4bd321d8';
  request_id uuid := gen_random_uuid();
  second_request_id uuid := gen_random_uuid();
  first_payment uuid;
  new_payment uuid;
  returned_id uuid;
  before_balance numeric;
  before_real jsonb;
  duplicate_blocked boolean := false;
  mismatch_blocked boolean := false;
BEGIN
  SELECT balance INTO before_balance FROM public.bank_accounts WHERE id = card_id;
  SELECT jsonb_agg(jsonb_build_array(id, real_balance, real_balance_updated_at) ORDER BY id)
    INTO before_real FROM public.bank_accounts;

  returned_id := public.create_account_payable(
    request_id, 'TESTE REVERSÍVEL DE IDEMPOTÊNCIA', 1.23, category_id, card_id, DATE '2026-10-13', true
  );
  ASSERT returned_id = request_id, 'Create returned a different request ID';
  ASSERT (SELECT is_paid FROM public.accounts_payable WHERE id = request_id), 'Create and pay was not atomic';
  ASSERT (SELECT balance FROM public.bank_accounts WHERE id = card_id) = before_balance - 1.23,
    'Create and pay debited incorrectly';

  SELECT id INTO first_payment FROM public.financial_transactions
  WHERE reference_type = 'payable' AND type = 'payment' AND reference_id = request_id;
  ASSERT first_payment IS NOT NULL, 'Payment history was not created';
  ASSERT public.create_account_payable(
    request_id, 'TESTE REVERSÍVEL DE IDEMPOTÊNCIA', 1.23, category_id, card_id, DATE '2026-10-13', true
  ) = request_id, 'Repeated create failed';
  ASSERT public.pay_account_payable(request_id) = first_payment, 'Repeated payment created another ID';
  ASSERT (SELECT count(*) FROM public.financial_transactions WHERE reference_id = request_id) = 1,
    'Repeated request duplicated the statement';
  ASSERT (SELECT balance FROM public.bank_accounts WHERE id = card_id) = before_balance - 1.23,
    'Repeated request debited again';

  BEGIN
    INSERT INTO public.financial_transactions
      (user_id, description, amount, type, from_account_id, reference_id, reference_type, transaction_date)
    SELECT user_id, description, amount, type, from_account_id, reference_id, reference_type, transaction_date
    FROM public.financial_transactions WHERE id = first_payment;
  EXCEPTION WHEN unique_violation THEN
    duplicate_blocked := true;
  END;
  ASSERT duplicate_blocked, 'Native duplicate insertion was allowed';

  BEGIN
    PERFORM public.create_account_payable(
      request_id, 'TESTE REVERSÍVEL DE IDEMPOTÊNCIA', 1.24, category_id, card_id, DATE '2026-10-13', true
    );
  EXCEPTION WHEN invalid_parameter_value THEN
    mismatch_blocked := true;
  END;
  ASSERT mismatch_blocked, 'Reusing a request ID with a different amount was allowed';

  PERFORM public.create_account_payable(
    second_request_id, 'TESTE REVERSÍVEL DE IDEMPOTÊNCIA', 1.23, category_id, card_id, DATE '2026-10-13', true
  );
  ASSERT (SELECT count(*) FROM public.accounts_payable WHERE id IN (request_id, second_request_id)) = 2,
    'Two legitimate identical expenses were incorrectly merged';
  ASSERT (SELECT balance FROM public.bank_accounts WHERE id = card_id) = before_balance - 2.46,
    'Two separate expenses were not counted correctly';

  ASSERT public.undo_account_payable_payment(first_payment), 'Undo failed';
  ASSERT NOT (SELECT is_paid FROM public.accounts_payable WHERE id = request_id), 'Undo did not reopen payable';
  ASSERT (SELECT count(*) FROM public.financial_transactions WHERE reference_id = request_id) = 0,
    'Undo left a payment in history';
  ASSERT (SELECT balance FROM public.bank_accounts WHERE id = card_id) = before_balance - 1.23,
    'Undo did not restore the original payment amount';

  new_payment := public.pay_account_payable(request_id);
  ASSERT new_payment <> first_payment, 'Repaid expense reused a deleted transaction ID';
  ASSERT NOT public.undo_account_payable_payment(first_payment), 'A stale copy reopened the current payment';
  ASSERT (SELECT is_paid FROM public.accounts_payable WHERE id = request_id), 'Stale undo changed the payable';
  ASSERT (SELECT balance FROM public.bank_accounts WHERE id = card_id) = before_balance - 2.46,
    'Stale undo changed the balance';
  ASSERT before_real = (
    SELECT jsonb_agg(jsonb_build_array(id, real_balance, real_balance_updated_at) ORDER BY id)
    FROM public.bank_accounts
  ), 'Real Balance or its timestamp changed';

  ASSERT NOT has_function_privilege('anon', 'public.pay_account_payable(uuid)', 'EXECUTE'),
    'Anonymous payment execution is allowed';
  ASSERT NOT has_function_privilege('anon',
    'public.create_account_payable(uuid,text,numeric,uuid,uuid,date,boolean)', 'EXECUTE'),
    'Anonymous create execution is allowed';
END;
$tests$;
ROLLBACK;
SELECT 'passed; all test writes rolled back' AS financial_regression_result;
