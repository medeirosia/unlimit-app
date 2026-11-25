export const PAYPAL_ACCOUNT_ID = '8cb28ca7-95f3-4e93-9305-33c2d7771935';

export interface PayPalSyncStatus {
  enabled: boolean;
  last_run: {
    status: 'completed' | 'failed';
    created_at: string;
    sale_date: string | null;
  } | null;
}

export class PayPalSyncRequestError extends Error {
  constructor(public code: string, public status = 0) { super(code); }
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('INVALID_SYNC_RESPONSE');
  return value as Record<string, unknown>;
}

function timestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function parsePayPalStatus(value: unknown): PayPalSyncStatus {
  const data = object(value);
  if (data.ok !== true || typeof data.enabled !== 'boolean') throw new Error('INVALID_SYNC_RESPONSE');
  if (data.last_run === null) return { enabled: data.enabled, last_run: null };
  const last = object(data.last_run);
  if (!timestamp(last.created_at) || !['completed', 'failed'].includes(String(last.status))) throw new Error('INVALID_SYNC_RESPONSE');
  return { enabled: data.enabled, last_run: {
    status: last.status as 'completed' | 'failed', created_at: last.created_at,
    sale_date: typeof last.sale_date === 'string' ? last.sale_date : null,
  } };
}

export function summarizePayPalSync(value: unknown) {
  const data = object(value);
  if (data.ok !== true || data.mode !== 'daily_sales_import' || data.real_balance_untouched !== true || !Array.isArray(data.results) || !timestamp(data.last_synced_at)) throw new Error('INVALID_SYNC_RESPONSE');
  let newSales = 0;
  let alreadyImported = 0;
  for (const result of data.results) {
    const row = object(result);
    if (!Number.isSafeInteger(row.new_sales) || Number(row.new_sales) < 0 || !Number.isSafeInteger(row.already_imported) || Number(row.already_imported) < 0 || row.sales_count !== Number(row.new_sales) + Number(row.already_imported)) throw new Error('INVALID_SYNC_RESPONSE');
    newSales += Number(row.new_sales);
    alreadyImported += Number(row.already_imported);
  }
  return { newSales, alreadyImported, lastSyncedAt: data.last_synced_at,
    message: newSales === 0
      ? 'Nenhuma venda nova. Os lançamentos já estão atualizados.'
      : `${newSales} ${newSales === 1 ? 'venda importada' : 'vendas importadas'} do PayPal.`,
  };
}

export function formatPayPalSyncTime(value: string): string {
  if (!timestamp(value)) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export function payPalSyncErrorMessage(error: unknown): string {
  const code = error instanceof PayPalSyncRequestError ? error.code : '';
  if (['INVALID_USER_SESSION', 'AUTHENTICATION_REQUIRED'].includes(code)) return 'Sua sessão expirou. Entre novamente para sincronizar.';
  if (code === 'FINANCE_ACCOUNT_ACCESS_DENIED') return 'Sua conta não tem autorização para sincronizar este PayPal.';
  if (code === 'IMPORT_NOT_ENABLED') return 'A integração PayPal está desativada.';
  if (code === 'REPORT_REQUIRES_REVIEW' || code.startsWith('PAYPAL_') || code === 'DATABASE_OPERATION_REJECTED' || code === 'HISTORICAL_REPORT_GAP_REQUIRES_REVIEW') return 'A sincronização precisa de conferência. Os lançamentos anteriores foram preservados; o Saldo Real não foi alterado.';
  return 'Não foi possível concluir a consulta. Tente novamente; as vendas já importadas não serão duplicadas.';
}
