import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CUSTOMER_DISPLAY_CHANNEL_PREFIX = 'pos.customerDisplay';

const PALETTE = {
  cream: '#F4ECDC',
  creamSoft: '#EFE5D0',
  paper: '#FAF6EC',
  ink: '#1A1A1A',
  inkSoft: '#3D3935',
  muted: '#8B8275',
  line: '#D8CDB6',
  forest: '#143028',
  forestDeep: '#0B1F19',
  moss: '#2C5A47',
  gold: '#B8894A',
  goldSoft: '#D4A968',
  tomato: '#C84A2C',
};

const SERIF = "'Cormorant Garamond', 'Times New Roman', serif";
const SANS = "'IBM Plex Sans Thai', 'Prompt', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISPLAY = "'Prompt', 'IBM Plex Sans Thai', sans-serif";

type DisplayItem = {
  name: string;
  quantity: number;
  totalPrice: number;
  selectedOptions?: string[];
};

type DisplayState = {
  branchId: string;
  branchName: string;
  status: 'IDLE' | 'BUILDING' | 'CHECKOUT' | 'PROCESSING' | 'ORDER_CREATED' | 'QR_READY';
  items: DisplayItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  orderNo?: string | null;
  queueNo?: number | string | null;
  qr?: {
    qrImageDataUrl: string;
    promptpayId: string;
    promptpayName: string;
  } | null;
  updatedAt: string;
};

function customerDisplayKey(branchId: string) {
  return `${CUSTOMER_DISPLAY_CHANNEL_PREFIX}.${branchId}`;
}

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function createIdleState(branch: any): DisplayState {
  return {
    branchId: branch?.id || 'default',
    branchName: branch?.name || '456 Coffee',
    status: 'IDLE',
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    paymentMethod: 'CASH',
    updatedAt: new Date().toISOString(),
  };
}

function readDisplayState(branch: any): DisplayState {
  if (!branch?.id) return createIdleState(branch);
  const raw = localStorage.getItem(customerDisplayKey(branch.id));
  if (!raw) return createIdleState(branch);
  try {
    return { ...createIdleState(branch), ...JSON.parse(raw) };
  } catch {
    return createIdleState(branch);
  }
}

const STATUS_COPY: Record<DisplayState['status'], { th: string; en: string }> = {
  IDLE: { th: 'พร้อมให้บริการ', en: 'ready to serve' },
  BUILDING: { th: 'กำลังเลือกรายการ', en: 'building order' },
  CHECKOUT: { th: 'ตรวจสอบก่อนชำระ', en: 'review before payment' },
  PROCESSING: { th: 'กำลังสร้างออเดอร์', en: 'processing order' },
  ORDER_CREATED: { th: 'สั่งซื้อสำเร็จ', en: 'order confirmed' },
  QR_READY: { th: 'กำลังรอการชำระเงิน', en: 'awaiting payment' },
};

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'เงินสด',
  QR: 'PromptPay QR',
  CARD: 'บัตร',
  TRANSFER: 'โอนเงิน',
};

export default function CustomerDisplayView({ branch }: any) {
  const [now, setNow] = useState(new Date());
  const [display, setDisplay] = useState<DisplayState>(() => readDisplayState(branch));

  useEffect(() => {
    setDisplay(readDisplayState(branch));
  }, [branch?.id]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!branch?.id) return;
    const key = customerDisplayKey(branch.id);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return;
      try {
        setDisplay({ ...createIdleState(branch), ...JSON.parse(event.newValue) });
      } catch {
        setDisplay(createIdleState(branch));
      }
    };
    window.addEventListener('storage', onStorage);

    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(key);
      channel.onmessage = (event) => {
        setDisplay({ ...createIdleState(branch), ...event.data });
      };
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
    };
  }, [branch?.id, branch?.name]);

  const itemCount = useMemo(
    () => display.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [display.items],
  );

  const clockText = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const orderNoText = display.orderNo ? String(display.orderNo) : '—';
  const queueText = display.queueNo ? String(display.queueNo) : '—';

  const status = STATUS_COPY[display.status];
  const isWaitingPayment =
    display.status === 'CHECKOUT' || display.status === 'QR_READY' || display.status === 'PROCESSING';

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: PALETTE.cream,
        color: PALETTE.ink,
        fontFamily: SANS,
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(184,137,74,0.08), transparent 50%), radial-gradient(circle at 85% 85%, rgba(20,48,40,0.06), transparent 50%)`,
      }}
    >
      {/* Paper grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-50 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.05 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-[2] h-full grid grid-cols-1 lg:grid-cols-[1.35fr_1fr]">
        {/* ============ LEFT: ORDER PANEL ============ */}
        <section
          className="flex flex-col overflow-hidden px-8 lg:px-11 pt-8 pb-7"
          style={{ borderRight: `1px dashed ${PALETTE.line}` }}
        >
          {/* Brand header */}
          <header
            className="flex items-end justify-between pb-5 mb-6"
            style={{ borderBottom: `1px solid ${PALETTE.ink}` }}
          >
            <div className="flex items-baseline gap-3.5">
              <div
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center translate-y-[6px] shrink-0"
                style={{
                  background: PALETTE.forest,
                  color: PALETTE.cream,
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontSize: 26,
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(20, 48, 40, 0.2)',
                }}
              >
                4
              </div>
              <div>
                <div
                  className="leading-none truncate"
                  style={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontWeight: 500,
                    fontSize: 30,
                    letterSpacing: '0.5px',
                  }}
                >
                  {display.branchName || branch?.name || '456 Coffee'}
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontSize: 10,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: PALETTE.muted,
                    fontWeight: 500,
                  }}
                >
                  Specialty · Coffee · Bakery
                </div>
              </div>
            </div>

            <div
              className="text-right leading-[1.7]"
              style={{ fontFamily: MONO, fontSize: 11, color: PALETTE.muted }}
            >
              <div>
                ORDER <span style={{ color: PALETTE.ink, fontWeight: 500 }}>#{orderNoText}</span>
              </div>
              <div>
                QUEUE <span style={{ color: PALETTE.ink, fontWeight: 500 }}>{queueText}</span>
              </div>
              <div>
                BRANCH <span style={{ color: PALETTE.ink, fontWeight: 500 }}>{branch?.code || '—'}</span>
              </div>
            </div>
          </header>

          {/* Order title */}
          <div className="flex justify-between items-baseline mb-4">
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: '-0.3px',
              }}
            >
              รายการสั่งซื้อ
              <span
                className="ml-1.5"
                style={{
                  color: PALETTE.gold,
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontWeight: 500,
                }}
              >
                — your order
              </span>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: PALETTE.muted,
                letterSpacing: 1,
              }}
            >
              {String(itemCount).padStart(2, '0')} ITEMS
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 -mr-2 cd-scroll">
            {display.items.length === 0 ? (
              <EmptyItems status={display.status} />
            ) : (
              <AnimatePresence initial={false}>
                {display.items.map((item, index) => (
                  <motion.div
                    key={`${item.name}-${index}-${item.quantity}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="grid items-start gap-4 py-3.5"
                    style={{
                      gridTemplateColumns: '32px 1fr auto',
                      borderBottom: `1px dotted ${PALETTE.line}`,
                    }}
                  >
                    <div
                      className="text-center py-0.5 leading-[1.4]"
                      style={{
                        fontFamily: MONO,
                        fontSize: 14,
                        fontWeight: 500,
                        color: PALETTE.forest,
                        background: PALETTE.paper,
                        border: `1px solid ${PALETTE.line}`,
                        borderRadius: 4,
                      }}
                    >
                      {item.quantity}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="truncate"
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: PALETTE.ink,
                          lineHeight: 1.35,
                          fontFamily: DISPLAY,
                        }}
                      >
                        {item.name}
                      </div>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div
                          className="mt-1 truncate"
                          style={{
                            fontSize: 12,
                            color: PALETTE.muted,
                            lineHeight: 1.4,
                            fontWeight: 300,
                          }}
                        >
                          {item.selectedOptions.map((opt, i) => (
                            <span key={i}>
                              {opt}
                              {i < item.selectedOptions!.length - 1 && (
                                <span style={{ color: PALETTE.gold, margin: '0 6px' }}>·</span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div
                      className="text-right whitespace-nowrap pt-0.5"
                      style={{
                        fontFamily: MONO,
                        fontSize: 15,
                        fontWeight: 500,
                        color: PALETTE.ink,
                      }}
                    >
                      {formatMoney(item.totalPrice)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Totals strip */}
          <div className="mt-4 pt-4" style={{ borderTop: `2px solid ${PALETTE.ink}` }}>
            <TotalsRow label="ยอดรวมก่อนส่วนลด · Subtotal" value={formatMoney(display.subtotal)} />
            {display.discount > 0 && (
              <TotalsRow
                label="ส่วนลด · Discount"
                value={`-${formatMoney(display.discount)}`}
                discount
              />
            )}
            <TotalsRow
              label="วิธีชำระ · Payment"
              value={PAYMENT_LABEL[display.paymentMethod] || display.paymentMethod}
              text
            />
          </div>
        </section>

        {/* ============ RIGHT: PAYMENT PANEL ============ */}
        <section
          className="relative flex flex-col overflow-hidden px-9 lg:px-10 pt-9 pb-8"
          style={{ background: PALETTE.forest, color: PALETTE.cream }}
        >
          {/* Decorative arches */}
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              top: -120,
              right: -120,
              width: 360,
              height: 360,
              border: '1px solid rgba(212, 169, 104, 0.18)',
            }}
          />
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              top: -60,
              right: -60,
              width: 240,
              height: 240,
              border: '1px solid rgba(212, 169, 104, 0.12)',
            }}
          />

          {/* Eyebrow */}
          <div
            className="flex items-center gap-2.5 relative z-[2]"
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: PALETTE.goldSoft,
            }}
          >
            <span style={{ width: 24, height: 1, background: PALETTE.goldSoft, display: 'inline-block' }} />
            {display.qr?.qrImageDataUrl
              ? 'Scan to Pay'
              : display.status === 'ORDER_CREATED'
              ? 'Order Confirmed'
              : 'Welcome'}
          </div>

          <div
            className="mt-2.5 relative z-[2]"
            style={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 28,
              letterSpacing: '0.3px',
              color: PALETTE.cream,
            }}
          >
            {display.status === 'ORDER_CREATED' ? 'ขอบคุณค่ะ ☕' : 'ขอบคุณที่แวะมา ☕'}
          </div>

          {/* Total block */}
          <div
            className="mt-6 py-5 relative z-[2]"
            style={{
              borderTop: '1px solid rgba(212, 169, 104, 0.25)',
              borderBottom: '1px solid rgba(212, 169, 104, 0.25)',
            }}
          >
            <div
              className="mb-1.5"
              style={{
                fontSize: 13,
                color: PALETTE.goldSoft,
                fontWeight: 400,
                letterSpacing: 1,
              }}
            >
              ยอดที่ต้องชำระ · TOTAL DUE
            </div>
            <div
              className="flex items-baseline gap-3"
              style={{
                fontFamily: DISPLAY,
                fontSize: 64,
                fontWeight: 600,
                color: PALETTE.cream,
                letterSpacing: '-2px',
                lineHeight: 1,
              }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: PALETTE.goldSoft,
                  letterSpacing: 0,
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                }}
              >
                ฿
              </span>
              <motion.span
                key={display.total}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="tabular-nums"
              >
                {formatMoney(display.total)}
              </motion.span>
              <span
                className="self-end"
                style={{
                  fontSize: 22,
                  color: PALETTE.goldSoft,
                  fontWeight: 400,
                  marginBottom: 8,
                  marginLeft: -2,
                }}
              >
                บาท
              </span>
            </div>
          </div>

          {/* Body section — QR / Cash / Idle / Confirmed */}
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center mt-4 relative z-[2]">
            <AnimatePresence mode="wait">
              {display.status === 'PROCESSING' ? (
                <ProcessingBlock key="processing" />
              ) : display.qr?.qrImageDataUrl ? (
                <QRBlock
                  key="qr"
                  qrImageDataUrl={display.qr.qrImageDataUrl}
                  promptpayId={display.qr.promptpayId}
                  promptpayName={display.qr.promptpayName}
                />
              ) : display.status === 'ORDER_CREATED' ? (
                <ConfirmedBlock key="confirmed" orderNo={display.orderNo} queueNo={display.queueNo} />
              ) : display.paymentMethod === 'CASH' && isWaitingPayment ? (
                <CashBlock
                  key="cash"
                  cashReceived={display.cashReceived}
                  change={display.change}
                />
              ) : display.paymentMethod === 'QR' && display.status === 'CHECKOUT' ? (
                <PendingQRBlock key="pending-qr" />
              ) : (
                <IdleBlock key="idle" />
              )}
            </AnimatePresence>
          </div>

          {/* Status bar */}
          <div
            className="mt-5 pt-4 flex items-center justify-between relative z-[2]"
            style={{ borderTop: '1px dashed rgba(212, 169, 104, 0.2)' }}
          >
            <div
              className="flex items-center gap-2.5"
              style={{ fontSize: 12, color: PALETTE.cream, letterSpacing: '0.5px' }}
            >
              <span className="cd-pulse" />
              <span>
                {status.th} · <span style={{ opacity: 0.7 }}>{status.en}</span>
              </span>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: PALETTE.goldSoft,
                letterSpacing: 1,
              }}
            >
              {clockText}
            </div>
          </div>
        </section>
      </div>

      {/* Inline keyframes / scrollbar */}
      <style>{`
        .cd-scroll::-webkit-scrollbar { width: 4px; }
        .cd-scroll::-webkit-scrollbar-track { background: transparent; }
        .cd-scroll::-webkit-scrollbar-thumb { background: ${PALETTE.line}; border-radius: 2px; }
        .cd-pulse {
          width: 8px;
          height: 8px;
          background: #6BCB7C;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(107, 203, 124, 0.7);
          animation: cd-pulse 1.6s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes cd-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(107, 203, 124, 0.7); }
          50% { box-shadow: 0 0 0 8px rgba(107, 203, 124, 0); }
        }
      `}</style>
    </div>
  );
}

function TotalsRow({
  label,
  value,
  discount,
  text,
}: {
  label: string;
  value: string;
  discount?: boolean;
  text?: boolean;
}) {
  return (
    <div
      className="flex justify-between py-1"
      style={{
        fontFamily: text ? SANS : MONO,
        fontSize: 13,
        color: PALETTE.inkSoft,
      }}
    >
      <span style={{ fontFamily: SANS, fontWeight: 400 }}>{label}</span>
      <span style={{ color: discount ? PALETTE.tomato : PALETTE.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function EmptyItems({ status }: { status: DisplayState['status'] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col items-center justify-center text-center px-8 py-12"
    >
      <div
        className="w-[68px] h-[68px] rounded-full flex items-center justify-center mb-5"
        style={{
          background: PALETTE.paper,
          border: `1px dashed ${PALETTE.line}`,
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 28,
          color: PALETTE.gold,
        }}
      >
        ☕
      </div>
      <p
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 24,
          color: PALETTE.ink,
          letterSpacing: '0.3px',
        }}
      >
        {status === 'IDLE' ? 'ยินดีต้อนรับ' : 'รอแคชเชียร์เพิ่มสินค้า'}
      </p>
      <p
        className="mt-2"
        style={{
          fontSize: 12,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: PALETTE.muted,
        }}
      >
        Awaiting your selection
      </p>
    </motion.div>
  );
}

function QRBlock({
  qrImageDataUrl,
  promptpayId,
  promptpayName,
}: {
  qrImageDataUrl: string;
  promptpayId: string;
  promptpayName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center"
    >
      {/* QR frame with corner brackets */}
      <div
        className="relative p-3.5 rounded-md"
        style={{
          background: PALETTE.cream,
          boxShadow: '0 30px 50px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,169,104,0.2)',
        }}
      >
        <CornerBracket position="tl" />
        <CornerBracket position="br" />
        <div className="w-[200px] h-[200px] flex items-center justify-center">
          <img src={qrImageDataUrl} alt="PromptPay QR" className="block w-[200px] h-[200px]" />
        </div>
      </div>

      {/* PromptPay strip */}
      <div
        className="mt-4 flex items-center gap-2.5 px-4 py-2 rounded-full"
        style={{
          background: 'rgba(212, 169, 104, 0.08)',
          border: '1px solid rgba(212, 169, 104, 0.25)',
        }}
      >
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center"
          style={{
            background: PALETTE.goldSoft,
            color: PALETTE.forestDeep,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          P
        </span>
        <span style={{ fontSize: 12, color: PALETTE.cream, letterSpacing: '0.5px' }}>
          <strong style={{ color: PALETTE.goldSoft, fontWeight: 600 }}>{promptpayName}</strong>{' '}
          · {promptpayId}
        </span>
      </div>

      {/* Instructions */}
      <div
        className="mt-4 text-center max-w-[280px]"
        style={{ fontSize: 13, color: 'rgba(244, 236, 220, 0.7)', lineHeight: 1.6 }}
      >
        <span style={{ fontFamily: MONO, color: PALETTE.goldSoft, marginRight: 6 }}>01</span>
        เปิดแอปธนาคาร เลือกสแกน
        <span style={{ fontFamily: MONO, color: PALETTE.goldSoft, marginLeft: 12, marginRight: 6 }}>
          02
        </span>
        ยืนยันยอดและกดจ่าย
      </div>
    </motion.div>
  );
}

function CornerBracket({ position }: { position: 'tl' | 'br' }) {
  const base: any = {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: PALETTE.goldSoft,
    borderWidth: 2,
    borderStyle: 'solid',
  };
  if (position === 'tl') {
    return (
      <span
        style={{
          ...base,
          top: -7,
          left: -7,
          borderRight: 'none',
          borderBottom: 'none',
        }}
      />
    );
  }
  return (
    <span
      style={{
        ...base,
        bottom: -7,
        right: -7,
        borderLeft: 'none',
        borderTop: 'none',
      }}
    />
  );
}

function ProcessingBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center gap-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full"
        style={{
          border: `2px solid rgba(212,169,104,0.2)`,
          borderTopColor: PALETTE.goldSoft,
        }}
      />
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 22, color: PALETTE.cream }}>
        กำลังสร้างออเดอร์
      </div>
      <div style={{ fontSize: 12, color: 'rgba(244,236,220,0.6)', letterSpacing: 1 }}>
        please wait a moment
      </div>
    </motion.div>
  );
}

function ConfirmedBlock({
  orderNo,
  queueNo,
}: {
  orderNo?: string | null;
  queueNo?: number | string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center text-center"
    >
      <div
        className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-5"
        style={{
          background: PALETTE.cream,
          color: PALETTE.forest,
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 44,
          fontWeight: 500,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(212,169,104,0.3)',
        }}
      >
        ✓
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 28,
          color: PALETTE.cream,
          letterSpacing: '0.3px',
        }}
      >
        สั่งซื้อสำเร็จ
      </div>
      <div
        className="mt-4 grid grid-cols-2 gap-3 w-full max-w-[300px]"
        style={{ fontFamily: MONO, fontSize: 12, color: PALETTE.cream }}
      >
        <div className="text-center py-2.5 rounded" style={{ background: 'rgba(212,169,104,0.08)', border: '1px solid rgba(212,169,104,0.25)' }}>
          <div style={{ color: PALETTE.goldSoft, fontSize: 10, letterSpacing: 2 }}>ORDER</div>
          <div className="mt-1" style={{ fontSize: 16, fontWeight: 500 }}>
            #{orderNo || '—'}
          </div>
        </div>
        <div className="text-center py-2.5 rounded" style={{ background: 'rgba(212,169,104,0.08)', border: '1px solid rgba(212,169,104,0.25)' }}>
          <div style={{ color: PALETTE.goldSoft, fontSize: 10, letterSpacing: 2 }}>QUEUE</div>
          <div className="mt-1" style={{ fontSize: 16, fontWeight: 500 }}>
            {queueNo || '—'}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CashBlock({
  cashReceived,
  change,
}: {
  cashReceived?: number;
  change?: number;
}) {
  const hasCash = cashReceived && cashReceived > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center text-center"
    >
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 26,
          color: PALETTE.cream,
          letterSpacing: '0.3px',
        }}
      >
        ชำระเงินสดที่เคาน์เตอร์
      </div>
      <div
        className="mt-2"
        style={{
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: 'rgba(244,236,220,0.55)',
        }}
      >
        Pay at the counter
      </div>
      {hasCash && (
        <div
          className="mt-6 grid grid-cols-2 gap-3 w-full max-w-[320px]"
          style={{ fontFamily: MONO }}
        >
          <div
            className="py-3 rounded text-center"
            style={{
              background: 'rgba(212,169,104,0.08)',
              border: '1px solid rgba(212,169,104,0.25)',
            }}
          >
            <div style={{ color: PALETTE.goldSoft, fontSize: 10, letterSpacing: 2 }}>RECEIVED</div>
            <div className="mt-1.5" style={{ fontSize: 18, fontWeight: 500, color: PALETTE.cream }}>
              ฿{formatMoney(cashReceived)}
            </div>
          </div>
          <div
            className="py-3 rounded text-center"
            style={{
              background: 'rgba(107,203,124,0.10)',
              border: '1px solid rgba(107,203,124,0.35)',
            }}
          >
            <div style={{ color: '#9DDCA8', fontSize: 10, letterSpacing: 2 }}>CHANGE</div>
            <div className="mt-1.5" style={{ fontSize: 18, fontWeight: 500, color: '#D8F3DD' }}>
              ฿{formatMoney(change)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PendingQRBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center text-center"
    >
      <div
        className="w-[88px] h-[88px] rounded flex items-center justify-center mb-5"
        style={{
          background: PALETTE.cream,
          color: PALETTE.forest,
          fontFamily: MONO,
          fontSize: 36,
          letterSpacing: 1,
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
        }}
      >
        QR
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 24,
          color: PALETTE.cream,
        }}
      >
        พร้อมแสดง QR
      </div>
      <div
        className="mt-2"
        style={{ fontSize: 13, color: 'rgba(244,236,220,0.7)', maxWidth: 280 }}
      >
        รอแคชเชียร์กดยืนยันเพื่อสร้าง PromptPay QR
      </div>
    </motion.div>
  );
}

function IdleBlock() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col items-center text-center"
    >
      <div
        className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-5"
        style={{
          border: '1px solid rgba(212,169,104,0.3)',
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 40,
          color: PALETTE.goldSoft,
        }}
      >
        ☕
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontStyle: 'italic',
          fontSize: 26,
          color: PALETTE.cream,
          letterSpacing: '0.3px',
        }}
      >
        พร้อมให้บริการ
      </div>
      <div
        className="mt-2"
        style={{
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: 'rgba(244,236,220,0.55)',
        }}
      >
        Welcome — please order at the counter
      </div>
    </motion.div>
  );
}
