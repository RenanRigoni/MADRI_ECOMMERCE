import 'server-only'

type SafeFields = Record<string, string | number | boolean | null | undefined>

export function logPaymentEvent(level: 'info' | 'warn' | 'error', event: string, fields: SafeFields = {}): void {
  const entry = { scope: 'payments', event, ...fields }
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.info(entry)
}
