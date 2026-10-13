BEGIN;
LOCK TABLE public.bank_accounts, public.accounts_payable, public.financial_transactions
  IN SHARE ROW EXCLUSIVE MODE;

DO $repair$
DECLARE
  extra_ids uuid[] := ARRAY[
    'b0d9bd4a-1d87-4eaf-9c0c-eafc6c22daaf'::uuid,
    'f0415ea8-46e3-4765-a126-bbfabd26662b'::uuid
  ];
  card_id uuid := '5b438d83-1452-4414-9d2c-9cb8bbdbee3a';
  current_extras integer;
BEGIN
  SELECT count(*) INTO current_extras FROM public.accounts_payable WHERE id = ANY(extra_ids);
  IF current_extras = 0 AND (
    SELECT count(*) FROM private.financial_repair_archive
    WHERE repair_key = 'remove_extra_iofs_20261013' AND source_table = 'accounts_payable'
      AND record_id = ANY(extra_ids)
  ) = 2 THEN
    RETURN; -- Safe retry after a completed repair.
  END IF;
  IF current_extras <> 2 THEN
    RAISE EXCEPTION 'The two extra IOFs changed; repair stopped';
  END IF;
  IF (
    SELECT count(*) FROM public.accounts_payable
    WHERE bank_account_id = card_id AND description = 'IOF FACEBOOK' AND amount = 11.44
      AND due_date = DATE '2026-10-12' AND paid_date = DATE '2026-10-12' AND is_paid
  ) <> 5 THEN
    RAISE EXCEPTION 'Expected five matching paid IOFs before repair';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.accounts_payable WHERE id = ANY(extra_ids) AND (
      bank_account_id IS DISTINCT FROM card_id OR description IS DISTINCT FROM 'IOF FACEBOOK'
      OR amount IS DISTINCT FROM 11.44 OR due_date IS DISTINCT FROM DATE '2026-10-12'
      OR paid_date IS DISTINCT FROM DATE '2026-10-12' OR is_paid IS DISTINCT FROM true
    )
  ) THEN
    RAISE EXCEPTION 'Extra IOF data no longer matches the reviewed records';
  END IF;
  IF (
    SELECT count(*) FROM public.financial_transactions
    WHERE reference_id = ANY(extra_ids) AND reference_type = 'payable' AND type = 'payment'
  ) <> 2 THEN
    RAISE EXCEPTION 'Expected one statement row for each extra IOF';
  END IF;

  INSERT INTO private.financial_repair_archive (repair_key, source_table, record_id, row_data, reason)
  SELECT 'remove_extra_iofs_20261013', 'bank_accounts', id, to_jsonb(b),
    'Balance snapshot before removing two user-confirmed extra IOFs'
  FROM public.bank_accounts b ON CONFLICT DO NOTHING;
  INSERT INTO private.financial_repair_archive (repair_key, source_table, record_id, row_data, reason)
  SELECT 'remove_extra_iofs_20261013', 'accounts_payable', id, to_jsonb(p),
    'Two extra IOFs confirmed by user; oldest three identical charges retained'
  FROM public.accounts_payable p WHERE id = ANY(extra_ids) ON CONFLICT DO NOTHING;
  INSERT INTO private.financial_repair_archive (repair_key, source_table, record_id, row_data, reason)
  SELECT 'remove_extra_iofs_20261013', 'financial_transactions', id, to_jsonb(t),
    'Statement row belonging to a user-confirmed extra IOF'
  FROM public.financial_transactions t
  WHERE reference_id = ANY(extra_ids) AND reference_type = 'payable' AND type = 'payment'
  ON CONFLICT DO NOTHING;

  DELETE FROM public.financial_transactions
  WHERE reference_id = ANY(extra_ids) AND reference_type = 'payable' AND type = 'payment';
  DELETE FROM public.accounts_payable WHERE id = ANY(extra_ids);

  IF (
    SELECT count(*) FROM public.accounts_payable
    WHERE bank_account_id = card_id AND description = 'IOF FACEBOOK' AND amount = 11.44
      AND due_date = DATE '2026-10-12' AND paid_date = DATE '2026-10-12' AND is_paid
  ) <> 3 THEN
    RAISE EXCEPTION 'Repair did not preserve exactly three paid IOFs';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bank_accounts b
    JOIN private.financial_repair_archive a ON a.record_id = b.id
    WHERE a.repair_key = 'remove_extra_iofs_20261013' AND a.source_table = 'bank_accounts'
      AND (
        b.real_balance IS DISTINCT FROM (a.row_data->>'real_balance')::numeric
        OR b.real_balance_updated_at IS DISTINCT FROM (a.row_data->>'real_balance_updated_at')::timestamptz
        OR b.balance IS DISTINCT FROM (
          (a.row_data->>'balance')::numeric + CASE WHEN b.id = card_id THEN 22.88 ELSE 0 END
        )
      )
  ) THEN
    RAISE EXCEPTION 'Unexpected balance change; entire IOF repair rolled back';
  END IF;
END;
$repair$;
COMMIT;
SELECT name, balance, real_balance, real_balance_updated_at
FROM public.bank_accounts WHERE id = '5b438d83-1452-4414-9d2c-9cb8bbdbee3a';
