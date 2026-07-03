
-- Trigger function for accounts_payable changes
CREATE OR REPLACE FUNCTION public.auto_recalculate_balance_on_payable_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On DELETE or UPDATE, recalculate the OLD bank account
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      PERFORM recalculate_bank_account_balance(OLD.bank_account_id);
    END IF;
  END IF;

  -- On INSERT or UPDATE, recalculate the NEW bank account
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      -- Avoid double-recalculating if same account
      IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id)) THEN
        PERFORM recalculate_bank_account_balance(NEW.bank_account_id);
      ELSIF TG_OP = 'UPDATE' AND OLD.bank_account_id = NEW.bank_account_id THEN
        -- Same account but amount/status may have changed, already recalculated above
        NULL;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function for accounts_receivable changes
CREATE OR REPLACE FUNCTION public.auto_recalculate_balance_on_receivable_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On DELETE or UPDATE, recalculate the OLD bank account
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.bank_account_id IS NOT NULL THEN
      PERFORM recalculate_bank_account_balance(OLD.bank_account_id);
    END IF;
  END IF;

  -- On INSERT or UPDATE, recalculate the NEW bank account
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.bank_account_id IS NOT NULL THEN
      IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.bank_account_id IS DISTINCT FROM NEW.bank_account_id)) THEN
        PERFORM recalculate_bank_account_balance(NEW.bank_account_id);
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger function for financial_transactions changes
CREATE OR REPLACE FUNCTION public.auto_recalculate_balance_on_transaction_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- On DELETE or UPDATE, recalculate OLD accounts
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    IF OLD.from_account_id IS NOT NULL THEN
      PERFORM recalculate_bank_account_balance(OLD.from_account_id);
    END IF;
    IF OLD.to_account_id IS NOT NULL AND OLD.to_account_id IS DISTINCT FROM OLD.from_account_id THEN
      PERFORM recalculate_bank_account_balance(OLD.to_account_id);
    END IF;
  END IF;

  -- On INSERT or UPDATE, recalculate NEW accounts
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.from_account_id IS NOT NULL THEN
      IF TG_OP = 'INSERT' OR (OLD.from_account_id IS DISTINCT FROM NEW.from_account_id) THEN
        PERFORM recalculate_bank_account_balance(NEW.from_account_id);
      END IF;
    END IF;
    IF NEW.to_account_id IS NOT NULL AND NEW.to_account_id IS DISTINCT FROM NEW.from_account_id THEN
      IF TG_OP = 'INSERT' OR (OLD.to_account_id IS DISTINCT FROM NEW.to_account_id) THEN
        PERFORM recalculate_bank_account_balance(NEW.to_account_id);
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_auto_recalc_payable
  AFTER INSERT OR UPDATE OR DELETE ON public.accounts_payable
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_recalculate_balance_on_payable_change();

CREATE TRIGGER trg_auto_recalc_receivable
  AFTER INSERT OR UPDATE OR DELETE ON public.accounts_receivable
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_recalculate_balance_on_receivable_change();

CREATE TRIGGER trg_auto_recalc_transaction
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_recalculate_balance_on_transaction_change();
