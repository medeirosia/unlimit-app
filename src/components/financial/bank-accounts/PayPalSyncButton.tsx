import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalPermissions } from '@/contexts/PermissionsContext';
import { supabase } from '@/integrations/supabase/client';
import {
  PAYPAL_ACCOUNT_ID, PayPalSyncRequestError, formatPayPalSyncTime,
  parsePayPalStatus, payPalSyncErrorMessage, summarizePayPalSync,
} from '@/lib/paypalSync';
import type { PayPalSyncStatus } from '@/lib/paypalSync';

interface PayPalSyncButtonProps {
  accountId: string;
  onSynced?: () => Promise<void>;
}

async function invokeSync(action: 'status' | 'run'): Promise<unknown> {
  // The client sends only its normal login session, never provider/service keys.
  const { data, error } = await supabase.functions.invoke('paypal-daily-sync', { body: { action } });
  if (error) {
    const context = (error as { context?: unknown }).context;
    let code = 'SYNC_UNAVAILABLE';
    if (context instanceof Response) {
      try { const body = await context.clone().json(); if (typeof body.error === 'string') code = body.error; } catch { /* Generic safe message below. */ }
    }
    throw new PayPalSyncRequestError(code, context instanceof Response ? context.status : 0);
  }
  return data;
}

export function PayPalSyncControl({ busy, disabled, lastSyncedAt, hint, failed, onSync }: {
  busy: boolean; disabled: boolean; lastSyncedAt: string | null;
  hint?: string; failed?: boolean; onSync: () => void;
}) {
  return (
    <div className="flex max-w-[240px] flex-col items-end gap-1">
      <Button
        type="button" variant="outline" size="sm" disabled={disabled || busy}
        onClick={onSync} aria-busy={busy} aria-label="Sincronizar vendas do PayPal até ontem"
        title="Busca somente vendas até ontem, mantém a rotina das 9h e não altera o Saldo Real."
        className="h-8 gap-1.5 whitespace-nowrap px-2 text-xs"
      >
        <RefreshCw aria-hidden="true" className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
        {busy ? 'Sincronizando…' : 'Sincronizar PayPal'}
      </Button>
      <div role="status" aria-live="polite" className={`text-right text-[10px] leading-tight ${failed ? 'text-amber-700' : 'text-slate-400'}`}>
        {hint || (lastSyncedAt ? <>Última sincronização: <time dateTime={lastSyncedAt}>{formatPayPalSyncTime(lastSyncedAt)}</time></> : 'Ainda não sincronizado')}
      </div>
    </div>
  );
}

export function PayPalSyncButton({ accountId, onSynced }: PayPalSyncButtonProps) {
  const { user } = useAuth();
  const { can } = useGlobalPermissions();
  const eligible = accountId === PAYPAL_ACCOUNT_ID && !!user && can('financeiro.contas.editar') && can('financeiro.contas.ver_conta', accountId);
  const [status, setStatus] = useState<PayPalSyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string>();
  const [hidden, setHidden] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    if (!eligible) return;
    let active = true;
    setLoadingStatus(true);
    setHidden(false);
    setHint(undefined);
    invokeSync('status').then((value) => {
      if (active) setStatus(parsePayPalStatus(value));
    }).catch((error: unknown) => {
      if (!active) return;
      if (error instanceof PayPalSyncRequestError && error.status === 403) setHidden(true);
      else setHint('Não foi possível consultar. Clique para tentar novamente.');
    }).finally(() => { if (active) setLoadingStatus(false); });
    return () => { active = false; };
  }, [eligible, user?.id]);

  const synchronize = async () => {
    if (inFlight.current || !eligible) return;
    inFlight.current = true;
    setBusy(true);
    setHint(undefined);
    try {
      const result = summarizePayPalSync(await invokeSync('run'));
      if (mounted.current) {
        setStatus({ enabled: true, last_run: { status: 'completed', created_at: result.lastSyncedAt, sale_date: null } });
        toast.success(result.message);
      }
    } catch (error: unknown) {
      if (mounted.current) {
        setHint('A última tentativa não foi concluída. Tente novamente ou confira os lançamentos.');
        toast.error(payPalSyncErrorMessage(error));
      }
    } finally {
      // A prior closed day may have completed even if a later report failed.
      // Refresh both this account list and the financial summary in either case.
      try { await onSynced?.(); } catch { if (mounted.current) toast.info('Recarregue o financeiro para ver os saldos atualizados.'); }
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  if (!eligible || hidden) return null;
  const failed = !!hint || status?.last_run?.status === 'failed';
  return <PayPalSyncControl
    busy={busy} disabled={loadingStatus || status?.enabled === false}
    lastSyncedAt={status?.last_run?.status === 'completed' ? status.last_run.created_at : null}
    failed={failed}
    hint={loadingStatus ? 'Consultando última sincronização…' : hint || (status?.enabled === false ? 'Rotina desativada' : status?.last_run?.status === 'failed' ? 'Última tentativa falhou; clique para conferir novamente.' : undefined)}
    onSync={() => { void synchronize(); }}
  />;
}
