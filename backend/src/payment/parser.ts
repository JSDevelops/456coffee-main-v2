const INCOME_HINTS = [
  'รับโอน',
  'เงินเข้า',
  'โอนเข้า',
  'รับเงิน',
  'ได้รับ',
  'เข้าบัญชี',
  'deposit',
  'credited',
  'received',
  'payment received',
  'transfer in',
  'refund',
];

const EXPENSE_HINTS = [
  'โอนออก',
  'ถอนเงิน',
  'ชำระบิล',
  'ชำระ',
  'จ่าย',
  'หักเงิน',
  'debited',
  'withdrawn',
  'paid',
  'transfer out',
];

const BANK_HINTS: Array<{ code: string; hints: string[] }> = [
  { code: 'SCB', hints: ['scb', 'ไทยพาณิชย์'] },
  { code: 'KBANK', hints: ['kbank', 'k plus', 'กสิกร'] },
  { code: 'KTB', hints: ['ktb', 'krungthai', 'กรุงไทย'] },
  { code: 'BBL', hints: ['bbl', 'bangkok bank', 'กรุงเทพ'] },
  { code: 'BAY', hints: ['bay', 'krungsri', 'กรุงศรี'] },
  { code: 'TTB', hints: ['ttb', 'tmb', 'ธนชาต'] },
  { code: 'GSB', hints: ['gsb', 'ออมสิน'] },
  { code: 'TRUEMONEY', hints: ['truemoney'] },
  { code: 'LINEBK', hints: ['line bk'] },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function isLikelyIncomingPayment(message: string): boolean {
  const text = normalize(message);
  if (EXPENSE_HINTS.some((hint) => text.includes(hint))) return false;
  return INCOME_HINTS.some((hint) => text.includes(hint));
}

export function detectBankCode(input: {
  sender?: string | null;
  packageName?: string | null;
  message: string;
}) {
  const haystack = normalize(
    `${input.sender || ''} ${input.packageName || ''} ${input.message}`,
  );
  return BANK_HINTS.find((bank) => bank.hints.some((hint) => haystack.includes(hint)))
    ?.code;
}

export function extractAmount(message: string): number | null {
  const normalized = message.replace(/\s+/g, ' ');
  const contextual =
    normalized.match(
      /(รับโอน|เงินเข้า|โอนเข้า|deposit|credited|received|payment received|transfer in)[^0-9]{0,30}(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i,
    ) ||
    normalized.match(
      /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(บาท|บ\.|baht|thb|฿)/i,
    );

  const candidate =
    contextual?.[2] ||
    contextual?.[1] ||
    normalized.match(/\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g)?.[0] ||
    null;

  if (!candidate) return null;
  const amount = Number(candidate.replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : null;
}
