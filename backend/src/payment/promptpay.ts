function emv(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, '0')}${value}`;
}

function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function normalizePromptPayTarget(target: string) {
  const digits = target.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return { type: 'mobile', value: `0066${digits.slice(1)}` };
  }
  if (digits.length === 13) {
    return { type: 'nationalId', value: digits };
  }
  throw new Error('PromptPay target must be a Thai mobile number or 13-digit national ID');
}

function sanitizeMerchantName(name?: string | null): string {
  const cleaned = (name || '456 COFFEE')
    .trim()
    .replace(/[^A-Za-z0-9 .,&()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 25);
  return cleaned || '456 COFFEE';
}

export function buildPromptPayPayload(input: {
  target: string;
  amount: number;
  merchantName?: string | null;
  city?: string | null;
}) {
  const normalized = normalizePromptPayTarget(input.target);
  const merchantAccountInfo =
    emv('00', 'A000000677010111') +
    (normalized.type === 'mobile'
      ? emv('01', normalized.value)
      : emv('02', normalized.value));

  const amount = Number(input.amount || 0);
  const amountText = amount > 0 ? amount.toFixed(2) : '';
  const merchantName = sanitizeMerchantName(input.merchantName);
  const city = sanitizeMerchantName(input.city || 'Bangkok').slice(0, 15);

  const body =
    emv('00', '01') +
    emv('01', '12') +
    emv('29', merchantAccountInfo) +
    emv('52', '0000') +
    emv('53', '764') +
    (amountText ? emv('54', amountText) : '') +
    emv('58', 'TH') +
    emv('59', merchantName) +
    emv('60', city) +
    '6304';

  return `${body}${crc16Ccitt(body)}`;
}
