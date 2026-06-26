import { useEffect, useMemo, useState } from 'react';
import {
  Type,
  Check,
  AlertTriangle,
  Search,
  Palette,
  Image as ImageIcon,
  Globe,
  Bell,
  Shield,
  QrCode,
  Smartphone,
  Eye,
  EyeOff,
  MessageSquare,
  Mail,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { loadGoogleFont } from '../lib/applySettings';
import { Badge, Button, Card, Input, Select, Skeleton, Textarea, useToast } from '../components/ui';
import { PageHeader } from '../components/layout/PageHeader';
import { Pagination, paginateItems } from '../components/ui/Pagination';

const FONT_OPTIONS: { family: string; latin?: boolean; sample: string }[] = [
  { family: 'Prompt', sample: 'พรอม Prompt' },
  { family: 'Sarabun', sample: 'สารบรรณ Sarabun' },
  { family: 'Kanit', sample: 'คณิต Kanit' },
  { family: 'Mitr', sample: 'มิตร Mitr' },
  { family: 'Bai Jamjuree', sample: 'ไบ่ จำจุรี Bai Jamjuree' },
  { family: 'IBM Plex Sans Thai', sample: 'IBM Plex Sans ไทย' },
  { family: 'Noto Sans Thai', sample: 'Noto Sans ไทย' },
  { family: 'K2D', sample: 'K2D ทดสอบ' },
  { family: 'Mali', sample: 'มาลี Mali' },
  { family: 'Krub', sample: 'ครับ Krub' },
  { family: 'Athiti', sample: 'อาทิตย์ Athiti' },
  { family: 'Niramit', sample: 'นิรมิต Niramit' },
  { family: 'Maitree', sample: 'ไมตรี Maitree' },
  { family: 'Pridi', sample: 'ปรีดี Pridi' },
  { family: 'Trirong', sample: 'ตรีรงค์ Trirong' },
  { family: 'Charm', sample: 'จาม Charm' },
  { family: 'Sriracha', sample: 'ศรีราชา Sriracha' },
  { family: 'Itim', sample: 'อิทิม Itim' },
  { family: 'Chakra Petch', sample: 'จักรเพชร Chakra Petch' },
  { family: 'Inter', latin: true, sample: 'Inter Latin only' },
  { family: 'Plus Jakarta Sans', latin: true, sample: 'Plus Jakarta Sans' },
  { family: 'Sora', latin: true, sample: 'Sora Latin only' },
];

type Tab = 'appearance' | 'branding' | 'general' | 'integrations' | 'notifications' | 'security';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'appearance',    label: 'รูปลักษณ์',     icon: Palette },
  { id: 'branding',      label: 'แบรนด์',         icon: ImageIcon },
  { id: 'general',       label: 'ทั่วไป',          icon: Globe },
  { id: 'integrations',  label: 'เชื่อมต่อ API / เข้าสู่ระบบ', icon: Smartphone },
  { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
  { id: 'security',      label: 'ความปลอดภัย', icon: Shield },
];

export default function SettingsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('appearance');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [previewFont, setPreviewFont] = useState<string>('');
  const [paymentForm, setPaymentForm] = useState({
    promptpayId: '',
    promptpayName: '',
    qrExpiryMinutes: '15',
    matchWindowMinutes: '180',
  });

  useEffect(() => {
    api
      .get<Record<string, string>>('/settings/admin')
      .then((s) => {
        setSettings(s);
        setPreviewFont(s['font.family'] || 'Prompt');
        setPaymentForm({
          promptpayId: s['payment.promptpayId'] || '',
          promptpayName: s['payment.promptpayName'] || '',
          qrExpiryMinutes: s['payment.qrExpiryMinutes'] || '15',
          matchWindowMinutes: s['payment.matchWindowMinutes'] || '180',
        });
      })
      .catch((e: any) => toast.error(e?.message || 'โหลด settings ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [toast]);

  const currentFont = settings['font.family'] || 'Prompt';
  const dirty = previewFont && previewFont !== currentFont;
  const generalDirty =
    paymentForm.promptpayId !== (settings['payment.promptpayId'] || '') ||
    paymentForm.promptpayName !== (settings['payment.promptpayName'] || '') ||
    paymentForm.qrExpiryMinutes !== (settings['payment.qrExpiryMinutes'] || '15') ||
    paymentForm.matchWindowMinutes !== (settings['payment.matchWindowMinutes'] || '180');

  const handleSave = async () => {
    if (!previewFont || saving) return;
    setSaving(true);
    try {
      const updated = await api.patch<Record<string, string>>('/settings', {
        settings: { 'font.family': previewFont },
      });
      setSettings(updated);
      loadGoogleFont(previewFont);
      toast.success(`บันทึกฟอนต์ ${previewFont} แล้ว`);
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneralSave = async () => {
    if (savingGeneral) return;
    setSavingGeneral(true);
    try {
      const updated = await api.patch<Record<string, string>>('/settings', {
        settings: {
          'payment.promptpayId': paymentForm.promptpayId.trim(),
          'payment.promptpayName': paymentForm.promptpayName.trim(),
          'payment.qrExpiryMinutes': paymentForm.qrExpiryMinutes.trim() || '15',
          'payment.matchWindowMinutes': paymentForm.matchWindowMinutes.trim() || '180',
        },
      });
      setSettings(updated);
      toast.success('บันทึกการตั้งค่าการรับชำระแล้ว');
    } catch (e: any) {
      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingGeneral(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="ตั้งค่าระบบ"
        description="ปรับแต่งรูปลักษณ์ แบรนด์ และพฤติกรรมของระบบทั้งหมด"
        actions={
          <>
            {dirty && tab === 'appearance' && (
              <Button onClick={handleSave} loading={saving} leftIcon={<Check size={14} />}>
                บันทึก
              </Button>
            )}
            {generalDirty && tab === 'general' && (
              <Button onClick={handleGeneralSave} loading={savingGeneral} leftIcon={<Check size={14} />}>
                บันทึก
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* Tab rail */}
        <Card padded={false} className="col-span-12 lg:col-span-3 h-fit">
          <div className="p-3 space-y-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? 'var(--accent-soft)' : 'transparent',
                    color: active ? 'var(--accent)' : 'var(--text-2)',
                    fontWeight: active ? 600 : 500,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--hover)'; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content */}
        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'appearance' && (
                <AppearanceTab
                  loading={loading}
                  currentFont={currentFont}
                  previewFont={previewFont}
                  setPreviewFont={setPreviewFont}
                  onSave={handleSave}
                  saving={saving}
                  dirty={!!dirty}
                />
              )}
              {tab === 'branding' && <ComingSoonTab title="แบรนด์" icon={<ImageIcon size={28} />} description="ตั้งค่าโลโก้ ชื่อร้าน และสีประจำแบรนด์ — เร็ว ๆ นี้" />}
              {tab === 'general' && (
                <GeneralTab
                  loading={loading}
                  values={paymentForm}
                  onChange={setPaymentForm}
                  onSave={handleGeneralSave}
                  saving={savingGeneral}
                  dirty={generalDirty}
                />
              )}
              {tab === 'integrations' && (
                <IntegrationsTab
                  loading={loading}
                  settings={settings}
                  onSave={async (updates) => {
                    setSaving(true);
                    try {
                      const res = await api.patch<Record<string, string>>('/settings/admin', { settings: updates });
                      setSettings(res);
                      toast.success('บันทึกการตั้งค่าการเชื่อมต่อ API เรียบร้อยแล้ว');
                    } catch (e: any) {
                      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  saving={saving}
                />
              )}
              {tab === 'notifications' && (
                <NotificationsTab
                  loading={loading}
                  settings={settings}
                  onSave={async (updates) => {
                    setSaving(true);
                    try {
                      const res = await api.patch<Record<string, string>>('/settings/admin', { settings: updates });
                      setSettings(res);
                      toast.success('บันทึกการตั้งค่าระบบแจ้งเตือนเรียบร้อยแล้ว');
                    } catch (e: any) {
                      toast.error(e?.message || 'บันทึกไม่สำเร็จ');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  saving={saving}
                />
              )}
              {tab === 'security' && <ComingSoonTab title="ความปลอดภัย" icon={<Shield size={28} />} description="2FA · Session · IP allowlist" />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function AppearanceTab({ loading, currentFont, previewFont, setPreviewFont, onSave, saving, dirty }: {
  loading: boolean;
  currentFont: string;
  previewFont: string;
  setPreviewFont: (s: string) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Pre-load all visible fonts
  useEffect(() => {
    FONT_OPTIONS.forEach((f) => loadGoogleFont(f.family));
    setTimeout(() => loadGoogleFont(currentFont), 50);
  }, [currentFont]);

  const filtered = useMemo(() => {
    if (!search) return FONT_OPTIONS;
    const q = search.toLowerCase();
    return FONT_OPTIONS.filter((f) => f.family.toLowerCase().includes(q) || f.sample.toLowerCase().includes(q));
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const pagedFonts = useMemo(
    () => paginateItems(filtered, page, pageSize),
    [filtered, page, pageSize],
  );

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-5">
      {/* Font card */}
      <Card padded>
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Type size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>ฟอนต์ระบบ</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>มีผลทันทีกับทุก app — admin / POS / LIFF / translator</p>
            </div>
          </div>
          <Badge tone="accent">ใช้อยู่: {currentFont}</Badge>
        </div>

        {/* Live preview */}
        <div
          className="rounded-2xl p-5 mb-5"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            fontFamily: `'${previewFont}', 'Noto Sans Thai', sans-serif`,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            ตัวอย่าง · {previewFont}
          </p>
          <p className="text-2xl font-bold mb-1.5" style={{ color: 'var(--text)' }}>456 Coffee — ระบบจัดการร้านกาแฟ</p>
          <p className="text-sm mb-1" style={{ color: 'var(--text-2)' }}>The quick brown fox jumps over the lazy dog. 0123456789</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>อเมริกาโน่ • ลาเต้ • คาปูชิโน่ • ชาไทย</p>
        </div>

        <Input containerClassName="mb-4" leftIcon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาฟอนต์..." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {pagedFonts.map((f) => {
            const selected = previewFont === f.family;
            return (
              <button
                key={f.family}
                onClick={() => setPreviewFont(f.family)}
                className="text-left p-3.5 rounded-xl transition-all"
                style={{
                  background: selected ? 'var(--accent-soft)' : 'var(--surface-2)',
                  border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm" style={{
                    color: selected ? 'var(--accent)' : 'var(--text)',
                    fontFamily: `'${f.family}', 'Noto Sans Thai', sans-serif`,
                  }}>{f.family}</span>
                  <div className="flex items-center gap-1.5">
                    {f.latin && <Badge tone="warning">Latin</Badge>}
                    {selected && <Check size={14} style={{ color: 'var(--accent)' }} />}
                  </div>
                </div>
                <p className="text-sm" style={{
                  color: 'var(--text-muted)',
                  fontFamily: `'${f.family}', 'Noto Sans Thai', sans-serif`,
                }}>{f.sample}</p>
              </button>
            );
          })}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="ฟอนต์"
          className="mt-4"
        />

        {dirty && (
          <div className="mt-5 rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'var(--accent-soft)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent)' }} />
            <p className="text-sm flex-1" style={{ color: 'var(--text)' }}>
              คุณเลือก <b>{previewFont}</b> แต่ยังไม่ได้บันทึก
            </p>
            <Button size="sm" onClick={onSave} loading={saving}>บันทึกเลย</Button>
          </div>
        )}
      </Card>

      {/* Theme color (placeholder) */}
      <Card padded>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Palette size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>สีหลัก (Accent)</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>กำหนดสีแบรนด์ของระบบ — เร็ว ๆ นี้</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Coffee', color: '#ea580c' },
            { name: 'Sunrise', color: '#f97316' },
            { name: 'Berry', color: '#db2777' },
            { name: 'Ocean', color: '#0891b2' },
            { name: 'Forest', color: '#10b981' },
            { name: 'Royal', color: '#7c3aed' },
          ].map((c) => (
            <div key={c.name} className="rounded-xl p-3 flex items-center gap-2 opacity-50 cursor-not-allowed" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <span className="w-8 h-8 rounded-lg" style={{ background: c.color }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{c.name}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function GeneralTab({
  loading,
  values,
  onChange,
  onSave,
  saving,
  dirty,
}: {
  loading: boolean;
  values: {
    promptpayId: string;
    promptpayName: string;
    qrExpiryMinutes: string;
    matchWindowMinutes: string;
  };
  onChange: (next: {
    promptpayId: string;
    promptpayName: string;
    qrExpiryMinutes: string;
    matchWindowMinutes: string;
  }) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}) {
  if (loading) return <Skeleton className="h-80 w-full" />;

  return (
    <div className="space-y-5">
      <Card padded>
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>PromptPay QR กลางของระบบ</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ใช้เป็นค่าจริงของ QR ทั้งระบบ ไม่ดึงพร้อมเพย์รายสาขามาแสดง
              </p>
            </div>
          </div>
          <Badge tone="accent">Runtime Settings</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="PromptPay ID"
            value={values.promptpayId}
            onChange={(e) => onChange({ ...values, promptpayId: e.target.value })}
            placeholder="เบอร์โทร 10 หลัก หรือเลขบัตร 13 หลัก"
          />
          <Input
            label="ชื่อบัญชี"
            value={values.promptpayName}
            onChange={(e) => onChange({ ...values, promptpayName: e.target.value })}
            placeholder="456 Coffee HQ"
          />
          <Input
            label="อายุ QR (นาที)"
            inputMode="numeric"
            value={values.qrExpiryMinutes}
            onChange={(e) => onChange({ ...values, qrExpiryMinutes: e.target.value.replace(/\D/g, '') })}
            placeholder="15"
          />
          <Input
            label="หน้าต่าง match payment (นาที)"
            inputMode="numeric"
            value={values.matchWindowMinutes}
            onChange={(e) => onChange({ ...values, matchWindowMinutes: e.target.value.replace(/\D/g, '') })}
            placeholder="180"
          />
        </div>

        {dirty && (
          <div className="mt-5 rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'var(--accent-soft)' }}>
            <AlertTriangle size={16} style={{ color: 'var(--accent)' }} />
            <p className="text-sm flex-1" style={{ color: 'var(--text)' }}>
              มีการเปลี่ยนแปลงค่า PromptPay / payment matching ที่ยังไม่ได้บันทึก
            </p>
            <Button size="sm" onClick={onSave} loading={saving}>บันทึกเลย</Button>
          </div>
        )}
      </Card>

      <Card padded>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}>
            <Smartphone size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Android Forwarder</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              ใช้บัญชีอุปกรณ์เพื่อให้แอพ Android เครื่องที่ดักแจ้งเตือนเชื่อมต่อเข้าระบบได้ หากใช้งานแค่เครื่องเดียวก็สร้างไว้เพียงชุดเดียวพอ
            </p>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          ไปที่หน้า <b>สาขา</b> แล้วเพิ่ม “อุปกรณ์รับแจ้งชำระเงิน” เพื่อสร้าง username/password ให้แอพ Android login โดยไม่ต้องมีขั้นตอนเลือกสาขาบนตัวแอป
        </p>
      </Card>
    </div>
  );
}

function ComingSoonTab({ title, icon, description }: { title: string; icon: React.ReactNode; description: string }) {
  return (
    <Card padded>
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>{description}</p>
        <Badge tone="warning" className="mt-5">เร็ว ๆ นี้</Badge>
      </div>
    </Card>
  );
}

function IntegrationsTab({
  loading,
  settings,
  onSave,
  saving,
}: {
  loading: boolean;
  settings: Record<string, string>;
  onSave: (updates: Record<string, string>) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    'login.google.enabled': 'false',
    'login.google.clientId': '',
    'secret.login.google.clientSecret': '',
    'login.line.enabled': 'false',
    'login.line.channelId': '',
    'secret.login.line.channelSecret': '',
    'login.line.liffId': '',
    'login.phone.enabled': 'true',
    'secret.login.sms.apiUrl': '',
    'secret.login.sms.apiKey': '',
    'login.sms.sender': '',
    'secret.login.sms.mockEnabled': 'true',
  });

  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showLineSecret, setShowLineSecret] = useState(false);
  const [showSmsKey, setShowSmsKey] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        'login.google.enabled': settings['login.google.enabled'] || 'false',
        'login.google.clientId': settings['login.google.clientId'] || '',
        'secret.login.google.clientSecret': settings['secret.login.google.clientSecret'] || '',
        'login.line.enabled': settings['login.line.enabled'] || 'false',
        'login.line.channelId': settings['login.line.channelId'] || '',
        'secret.login.line.channelSecret': settings['secret.login.line.channelSecret'] || '',
        'login.line.liffId': settings['login.line.liffId'] || '',
        'login.phone.enabled': settings['login.phone.enabled'] || 'true',
        'secret.login.sms.apiUrl': settings['secret.login.sms.apiUrl'] || '',
        'secret.login.sms.apiKey': settings['secret.login.sms.apiKey'] || '',
        'login.sms.sender': settings['login.sms.sender'] || '',
        'secret.login.sms.mockEnabled': settings['secret.login.sms.mockEnabled'] || 'true',
      });
    }
  }, [settings]);

  const dirty = useMemo(() => {
    return Object.keys(form).some(
      (k) => form[k as keyof typeof form] !== (settings[k] || (k === 'login.phone.enabled' ? 'true' : k === 'secret.login.sms.mockEnabled' ? 'true' : ''))
    );
  }, [form, settings]);

  const handleSaveClick = () => {
    onSave(form);
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* Google Card */}
      <Card padded>
        <div className="flex items-center gap-3 mb-5 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-[#2d241e]">Google Sign-In</h3>
              <p className="text-xs text-[#7c543c]/70 font-medium">ตั้งค่าเชื่อมต่อสำหรับการลงทะเบียนและเข้าสู่ระบบด้วยบัญชี Google</p>
            </div>
          </div>
          {form['login.google.enabled'] === 'true' && <Badge tone="success">เปิดใช้งาน</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="สถานะการใช้งาน"
            value={form['login.google.enabled']}
            onChange={(e) => setForm({ ...form, 'login.google.enabled': e.target.value })}
          >
            <option value="true">เปิดใช้งาน (Enabled)</option>
            <option value="false">ปิดใช้งาน (Disabled)</option>
          </Select>

          <Input
            label="Google Client ID"
            containerClassName="sm:col-span-2"
            value={form['login.google.clientId']}
            onChange={(e) => setForm({ ...form, 'login.google.clientId': e.target.value })}
            placeholder="xxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
          />

          <div className="sm:col-span-3 relative">
            <Input
              label="Google Client Secret"
              type={showGoogleSecret ? 'text' : 'password'}
              value={form['secret.login.google.clientSecret']}
              onChange={(e) => setForm({ ...form, 'secret.login.google.clientSecret': e.target.value })}
              placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={() => setShowGoogleSecret(!showGoogleSecret)}
              className="absolute right-3.5 top-[35px] text-[#7c543c]/60 hover:text-[#7c543c]"
            >
              {showGoogleSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </Card>

      {/* LINE Card */}
      <Card padded>
        <div className="flex items-center gap-3 mb-5 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-[#06C755]">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M22 10.155c0-4.664-4.786-8.455-10.667-8.455S.667 5.491.667 10.155c0 4.181 3.8 7.679 8.94 8.351.348.074.82.23.94.526.108.261.07.671.034.935-.038.286-.182 1.139-.222 1.554-.056.58-.261 2.274 1.127 1.241 1.388-1.033 6.012-4.428 8.2-7.562 2.378-3.411 2.316-6.425 2.316-6.425zm-14.869 3.01H5.532a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377zm3.178 0h-1.599a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377zm3.178 0a.377.377 0 0 1-.377-.377v-2.311l-1.782-2.148c-.066-.08-.063-.198.006-.275l.135-.152a.377.377 0 0 1 .536-.006l1.305 1.573 1.305-1.573a.377.377 0 0 1 .536.006l.135.152a.377.377 0 0 1 .006.275L13.86 10.457v2.311a.377.377 0 0 1-.377.377zm3.178 0h-1.599a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-[#2d241e]">LINE Login & LIFF</h3>
              <p className="text-xs text-[#7c543c]/70 font-medium">ตั้งค่าระบบสำหรับเชื่อมต่อแอป LINE Login เพื่อใช้งานระบบสมาชิกในและนอกแอป LINE</p>
            </div>
          </div>
          {form['login.line.enabled'] === 'true' && <Badge tone="success">เปิดใช้งาน</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="สถานะการใช้งาน"
            value={form['login.line.enabled']}
            onChange={(e) => setForm({ ...form, 'login.line.enabled': e.target.value })}
          >
            <option value="true">เปิดใช้งาน (Enabled)</option>
            <option value="false">ปิดใช้งาน (Disabled)</option>
          </Select>

          <Input
            label="LINE Channel ID"
            value={form['login.line.channelId']}
            onChange={(e) => setForm({ ...form, 'login.line.channelId': e.target.value })}
            placeholder="16xxxxxxxx"
          />

          <Input
            label="LINE LIFF ID"
            value={form['login.line.liffId']}
            onChange={(e) => setForm({ ...form, 'login.line.liffId': e.target.value })}
            placeholder="16xxxxxxxx-xxxxxxxx"
          />

          <div className="sm:col-span-3 relative">
            <Input
              label="LINE Channel Secret"
              type={showLineSecret ? 'text' : 'password'}
              value={form['secret.login.line.channelSecret']}
              onChange={(e) => setForm({ ...form, 'secret.login.line.channelSecret': e.target.value })}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={() => setShowLineSecret(!showLineSecret)}
              className="absolute right-3.5 top-[35px] text-[#7c543c]/60 hover:text-[#7c543c]"
            >
              {showLineSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </Card>

      {/* SMS Card */}
      <Card padded>
        <div className="flex items-center gap-3 mb-5 flex-wrap justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#2d241e]">เบอร์โทรศัพท์ (SMS OTP)</h3>
              <p className="text-xs text-[#7c543c]/70 font-medium">ตั้งค่าส่ง SMS จริงเพื่อลงทะเบียนยืนยันตัวตนด้วยรหัส OTP 6 หลัก</p>
            </div>
          </div>
          {form['login.phone.enabled'] === 'true' && <Badge tone="success">เปิดใช้งาน</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="สถานะการเข้าใช้งาน"
            value={form['login.phone.enabled']}
            onChange={(e) => setForm({ ...form, 'login.phone.enabled': e.target.value })}
          >
            <option value="true">เปิดใช้งาน (Enabled)</option>
            <option value="false">ปิดใช้งาน (Disabled)</option>
          </Select>

          <Select
            label="โหมดการทำงานส่ง OTP"
            value={form['secret.login.sms.mockEnabled']}
            onChange={(e) => setForm({ ...form, 'secret.login.sms.mockEnabled': e.target.value })}
          >
            <option value="true">ส่ง SMS จำลอง (Mock 123456 เท่านั้น)</option>
            <option value="false">ส่ง SMS จริง (SMS Gateway Integration)</option>
          </Select>

          <Input
            label="ชื่อผู้ส่ง (Sender ID)"
            value={form['login.sms.sender']}
            onChange={(e) => setForm({ ...form, 'login.sms.sender': e.target.value })}
            placeholder="456COFFEE"
          />

          <Input
            label="SMS Gateway API URL"
            containerClassName="sm:col-span-3"
            value={form['secret.login.sms.apiUrl']}
            onChange={(e) => setForm({ ...form, 'secret.login.sms.apiUrl': e.target.value })}
            placeholder="https://api.sms-gateway-provider.com/v1/send"
          />

          <div className="sm:col-span-3 relative">
            <Input
              label="SMS Gateway API Key / Token"
              type={showSmsKey ? 'text' : 'password'}
              value={form['secret.login.sms.apiKey']}
              onChange={(e) => setForm({ ...form, 'secret.login.sms.apiKey': e.target.value })}
              placeholder="api-key-xxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <button
              type="button"
              onClick={() => setShowSmsKey(!showSmsKey)}
              className="absolute right-3.5 top-[35px] text-[#7c543c]/60 hover:text-[#7c543c]"
            >
              {showSmsKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </Card>

      {dirty && (
        <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'var(--accent-soft)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent)' }} />
          <p className="text-sm flex-1 font-extrabold text-[#7c543c]">
            มีการเปลี่ยนแปลงค่าเชื่อมต่อ API ที่ยังไม่ได้บันทึก
          </p>
          <Button size="sm" onClick={handleSaveClick} loading={saving}>บันทึกทั้งหมด</Button>
        </div>
      )}
    </div>
  );
}

function NotificationsTab({
  loading,
  settings,
  onSave,
  saving,
}: {
  loading: boolean;
  settings: Record<string, string>;
  onSave: (updates: Record<string, string>) => Promise<void>;
  saving: boolean;
}) {
  const DEFAULT_LINE_TEXT = '\u2615 สวัสดีคุณ {ชื่อ}!\n\n🎁 มีข่าวสาร/โปรโมชั่นใหม่จาก 456 Coffee!\n\n📌 {หัวข้อ}\n📄 {รายละเอียด}\n\n{ลิงก์}\n\n— ทีมงาน 456 Coffee Atelier';
  const DEFAULT_EMAIL_SUBJECT = '[456 Coffee] {หัวข้อ}';
  const DEFAULT_EMAIL_BODY = '<h2 style="color:#ea580c">\u2615 456 Coffee Atelier</h2>\n<p>สวัสดีคุณ <strong>{ชื่อ}</strong>,</p>\n<p>{รายละเอียด}</p>\n<p><a href="{ลิงก์}" style="background:#ea580c;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">ดูรายละเอียดเพิ่มเติม</a></p>\n<hr/>\n<small>ส่งโดย 456 Coffee Atelier · ยกเลิกการแจ้งเตือนได้ในแอพ</small>';
  const DEFAULT_INAPP_TITLE = '\ud83d\udd14 ข่าวสารใหม่จาก 456 Coffee';
  const DEFAULT_INAPP_BODY = 'สวัสดีคุณ {ชื่อ}! มีข่าวสารและโปรโมชั่นพิเศษสำหรับคุณ 🎉\n{หัวข้อ}\n{รายละเอียด}';

  const [form, setForm] = useState({
    'notification.channels': 'IN_APP',
    'secret.notification.lineToken': '',
    'secret.notification.smtpHost': '',
    'secret.notification.smtpPort': '',
    'secret.notification.smtpUser': '',
    'secret.notification.smtpPassword': '',
    'notification.msg.inapp.title': DEFAULT_INAPP_TITLE,
    'notification.msg.inapp.body': DEFAULT_INAPP_BODY,
    'notification.msg.line.text': DEFAULT_LINE_TEXT,
    'notification.msg.email.subject': DEFAULT_EMAIL_SUBJECT,
    'notification.msg.email.body': DEFAULT_EMAIL_BODY,
  });

  const [showLineToken, setShowLineToken] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [activePreview, setActivePreview] = useState<null | 'line' | 'email' | 'inapp'>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        'notification.channels': settings['notification.channels'] || 'IN_APP',
        'secret.notification.lineToken': settings['secret.notification.lineToken'] || '',
        'secret.notification.smtpHost': settings['secret.notification.smtpHost'] || '',
        'secret.notification.smtpPort': settings['secret.notification.smtpPort'] || '',
        'secret.notification.smtpUser': settings['secret.notification.smtpUser'] || '',
        'secret.notification.smtpPassword': settings['secret.notification.smtpPassword'] || '',
        'notification.msg.inapp.title': settings['notification.msg.inapp.title'] || DEFAULT_INAPP_TITLE,
        'notification.msg.inapp.body': settings['notification.msg.inapp.body'] || DEFAULT_INAPP_BODY,
        'notification.msg.line.text': settings['notification.msg.line.text'] || DEFAULT_LINE_TEXT,
        'notification.msg.email.subject': settings['notification.msg.email.subject'] || DEFAULT_EMAIL_SUBJECT,
        'notification.msg.email.body': settings['notification.msg.email.body'] || DEFAULT_EMAIL_BODY,
      });
    }
  }, [settings]);

  const channelsList = useMemo(() => {
    return form['notification.channels'].split(',').map(c => c.trim()).filter(Boolean);
  }, [form['notification.channels']]);

  const toggleChannel = (channel: string) => {
    let nextChannels = [...channelsList];
    if (nextChannels.includes(channel)) {
      nextChannels = nextChannels.filter(c => c !== channel);
    } else {
      nextChannels.push(channel);
    }
    if (nextChannels.length === 0) {
      nextChannels = ['IN_APP'];
    }
    setForm(prev => ({
      ...prev,
      'notification.channels': nextChannels.join(','),
    }));
  };

  const dirty = useMemo(() => {
    return Object.keys(form).some(
      (k) => form[k as keyof typeof form] !== (
        settings[k] || (
          k === 'notification.channels' ? 'IN_APP' :
          k === 'notification.msg.inapp.title' ? DEFAULT_INAPP_TITLE :
          k === 'notification.msg.inapp.body' ? DEFAULT_INAPP_BODY :
          k === 'notification.msg.line.text' ? DEFAULT_LINE_TEXT :
          k === 'notification.msg.email.subject' ? DEFAULT_EMAIL_SUBJECT :
          k === 'notification.msg.email.body' ? DEFAULT_EMAIL_BODY : ''
        )
      )
    );
  }, [form, settings]);

  const handleSaveClick = () => {
    onSave(form);
  };

  // Render a preview of message text with sample data substituted
  const renderPreview = (text: string) => {
    return text
      .replace(/\{\u0e0a\u0e37\u0e48\u0e2d\}/g, 'สมศร')
      .replace(/\{\u0e2b\u0e31\u0e27\u0e02\u0e49\u0e2d\}/g, 'โปรโมชั่นเมนูพิเศษประจำเดือนมิถุนายน')
      .replace(/\{\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\}/g, 'ซื้อเครื่องดื่มครบเซ็ตรับส่วนลดสูงสุด 30% ในเดือนนี้')
      .replace(/\{\u0e25\u0e34\u0e07\u0e01\u0e4c\}/g, 'https://app.456coffee.com/promo')
      .replace(/\n/g, '<br/>');
  };

  const PLACEHOLDER_VARS = [
    { key: '{ชื่อ}', desc: 'ชื่อลูกค้า' },
    { key: '{หัวข้อ}', desc: 'สาระสำคัญของโปรโมชั่น' },
    { key: '{รายละเอียด}', desc: 'เนื้อหาเต็มของโปรโมชั่น' },
    { key: '{ลิงก์}', desc: 'ลิงก์ตอบรับ / รับสิทธิ์' },
  ];

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      {/* Channels selector */}
      <Card padded>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bell size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>ช่องทางการส่งแจ้งเตือน</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>เลือกช่องทางที่อนุญาตให้ส่งโปรโมชั่นและข่าวสารไปยังลูกค้า</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 p-4 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
          {[
            { id: 'IN_APP', label: 'แจ้งเตือนในระบบ / แอพ (In-App Notification)', desc: 'แสดงผลบนหน้าแดชบอร์ด/กระดิ่งแจ้งเตือน' },
            { id: 'LINE', label: 'LINE Broadcast / Messaging', desc: 'ส่งตรงเข้าบัญชี LINE Official Account / Notify' },
            { id: 'EMAIL', label: 'อีเมล (Email Notification)', desc: 'ส่งเข้ากล่องจดหมายอีเมลของลูกค้า' },
          ].map((ch) => {
            const isSelected = channelsList.includes(ch.id);
            return (
              <label key={ch.id} className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none flex-1 min-w-[250px] transition-all bg-[var(--surface)] hover:bg-[var(--surface-2)]" style={{ borderColor: isSelected ? 'var(--accent)' : 'var(--border)' }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleChannel(ch.id)}
                  className="mt-1 w-4.5 h-4.5 rounded accent-amber-500"
                />
                <div>
                  <span className="text-xs font-black" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{ch.label}</span>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{ch.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Card>

      {/* Variable placeholders helper */}
      <Card padded>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-500">
            <Info size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>ตัวแปรที่ใช้ได้ในข้อความ</h4>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>ใส่ตัวแปรเหล่านี้ในข้อความแจ้งเตือน ระบบจะแทนที่ด้วยข้อมูลจริงอัตโนมัติ</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PLACEHOLDER_VARS.map((v) => (
            <div key={v.key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <code className="text-xs font-black text-[var(--accent)]">{v.key}</code>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>= {v.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* In-App Message Template */}
      {channelsList.includes('IN_APP') && (
        <Card padded>
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: 'var(--text)' }}>ข้อความแจ้งเตือนภายในแอพ (In-App)</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ข้อความที่ปรากฏบนกระดิ่งแจ้งเตือนของลูกค้าในแอพ</p>
              </div>
            </div>
            <button
              onClick={() => setActivePreview(activePreview === 'inapp' ? null : 'inapp')}
              className="text-[11px] font-black px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: activePreview === 'inapp' ? 'var(--accent)' : 'var(--surface-2)',
                color: activePreview === 'inapp' ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {activePreview === 'inapp' ? 'ปิดตัวอย่าง' : 'ดูตัวอย่าง'}
            </button>
          </div>

          <div className="space-y-4">
            <Input
              label="หัวข้อการแจ้งเตือน (Notification Title)"
              value={form['notification.msg.inapp.title']}
              onChange={(e) => setForm({ ...form, 'notification.msg.inapp.title': e.target.value })}
              placeholder="เช่น 🔔 ข่าวสารใหม่จาก 456 Coffee"
            />
            <Textarea
              label="เนื้อหาสารแจ้งเตือน (Notification Body)"
              rows={4}
              value={form['notification.msg.inapp.body']}
              onChange={(e) => setForm({ ...form, 'notification.msg.inapp.body': e.target.value })}
              placeholder="สวัสดีคุณ {ชื่อ}!..."
            />
          </div>

          {activePreview === 'inapp' && (
            <div className="mt-5 rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                👁 ตัวอย่างการแสดงผล (ข้อมูลตัวอย่าง)
              </div>
              <div className="p-4" style={{ background: 'var(--surface)' }}>
                <div className="flex items-start gap-3 p-3 rounded-2xl shadow-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: 'var(--accent)' }}>
                    <Bell size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black" style={{ color: 'var(--text)' }}>
                      {form['notification.msg.inapp.title']}
                    </p>
                    <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}
                       dangerouslySetInnerHTML={{ __html: renderPreview(form['notification.msg.inapp.body']) }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* LINE Message Template */}
      {channelsList.includes('LINE') && (
        <Card padded>
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-[#06C755]">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M22 10.155c0-4.664-4.786-8.455-10.667-8.455S.667 5.491.667 10.155c0 4.181 3.8 7.679 8.94 8.351.348.074.82.23.94.526.108.261.07.671.034.935-.038.286-.182 1.139-.222 1.554-.056.58-.261 2.274 1.127 1.241 1.388-1.033 6.012-4.428 8.2-7.562 2.378-3.411 2.316-6.425 2.316-6.425zm-14.869 3.01H5.532a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377zm3.178 0h-1.599a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377zm3.178 0a.377.377 0 0 1-.377-.377v-2.311l-1.782-2.148c-.066-.08-.063-.198.006-.275l.135-.152a.377.377 0 0 1 .536-.006l1.305 1.573 1.305-1.573a.377.377 0 0 1 .536.006l.135.152a.377.377 0 0 1 .006.275L13.86 10.457v2.311a.377.377 0 0 1-.377.377zm3.178 0h-1.599a.377.377 0 0 1-.377-.377V8.524c0-.208.169-.377.377-.377h1.599a.377.377 0 0 1 .377.377v4.264a.377.377 0 0 1-.377.377z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: 'var(--text)' }}>ข้อความ LINE Message</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ข้อความที่จะส่งผ่าน LINE Broadcast API</p>
              </div>
            </div>
            <button
              onClick={() => setActivePreview(activePreview === 'line' ? null : 'line')}
              className="text-[11px] font-black px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: activePreview === 'line' ? '#06C755' : 'var(--surface-2)',
                color: activePreview === 'line' ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {activePreview === 'line' ? 'ปิดตัวอย่าง' : 'ดูตัวอย่าง'}
            </button>
          </div>

          <Textarea
            label="เนื้อหาข้อความ LINE (LINE Message Text)"
            rows={7}
            value={form['notification.msg.line.text']}
            onChange={(e) => setForm({ ...form, 'notification.msg.line.text': e.target.value })}
            placeholder="☕ สวัสดีคุณ {ชื่อ}!…"
          />
          <p className="text-[10px] font-bold mt-2" style={{ color: 'var(--text-muted)' }}>
            ℹ️ รองรับ\n สำหรับขึ้นบรรทัดใหม่ในข้อความ LINE
          </p>

          {/* LINE Token Config */}
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-black mb-3" style={{ color: 'var(--text-muted)' }}>LINE Channel Access Token</p>
            <div className="relative">
              <Input
                type={showLineToken ? 'text' : 'password'}
                value={form['secret.notification.lineToken']}
                onChange={(e) => setForm({ ...form, 'secret.notification.lineToken': e.target.value })}
                placeholder="eyJh... (Channel Access Token จาก LINE Developers console)"
              />
              <button
                type="button"
                onClick={() => setShowLineToken(!showLineToken)}
                className="absolute right-3.5 top-[13px] text-[#7c543c]/60 hover:text-[#7c543c]"
              >
                {showLineToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {activePreview === 'line' && (
            <div className="mt-5 rounded-2xl overflow-hidden border border-emerald-200">
              <div className="px-3 py-2 bg-[#06C755] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={12} />
                ตัวอย่างสาร LINE
              </div>
              <div className="p-4 bg-[#f0f0f0]">
                <div className="max-w-[280px] bg-white rounded-2xl rounded-tl-none shadow px-4 py-3">
                  <p className="text-sm font-medium text-stone-800 whitespace-pre-line">
                    {form['notification.msg.line.text']
                      .replace(/\{ชื่อ\}/g, 'สมศร')
                      .replace(/\{หัวข้อ\}/g, 'โปรโมชั่นเดือนมิถุนายน')
                      .replace(/\{รายละเอียด\}/g, 'ซื้อครบชุดรับส่วนลด 30%')
                      .replace(/\{ลิงก์\}/g, 'https://app.456coffee.com/promo')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Email Template */}
      {channelsList.includes('EMAIL') && (
        <Card padded>
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: 'var(--text)' }}>เทมเพลตอีเมล (Email Template)</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>รองรับ HTML สำหรับสร้างอีเมลสวยงาม</p>
              </div>
            </div>
            <button
              onClick={() => setActivePreview(activePreview === 'email' ? null : 'email')}
              className="text-[11px] font-black px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: activePreview === 'email' ? '#3b82f6' : 'var(--surface-2)',
                color: activePreview === 'email' ? 'white' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {activePreview === 'email' ? 'ปิดตัวอย่าง' : 'ดูตัวอย่าง'}
            </button>
          </div>

          <div className="space-y-4">
            <Input
              label="หัวข้ออีเมล (Email Subject)"
              value={form['notification.msg.email.subject']}
              onChange={(e) => setForm({ ...form, 'notification.msg.email.subject': e.target.value })}
              placeholder="เช่น [456 Coffee] {หัวข้อ}"
            />
            <Textarea
              label="เนื้อหาอีเมล (Email Body — HTML หรือข้อความธรรมดา)"
              rows={10}
              value={form['notification.msg.email.body']}
              onChange={(e) => setForm({ ...form, 'notification.msg.email.body': e.target.value })}
              placeholder="<h2>{หัวข้อ}</h2><p>{รายละเอียด}</p>..."
              className="font-mono text-xs"
            />
          </div>

          {/* SMTP Config */}
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs font-black mb-3" style={{ color: 'var(--text-muted)' }}>SMTP Server สำหรับส่งอีเมล</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="SMTP Host"
                containerClassName="sm:col-span-2"
                value={form['secret.notification.smtpHost']}
                onChange={(e) => setForm({ ...form, 'secret.notification.smtpHost': e.target.value })}
                placeholder="smtp.gmail.com หรือ smtp.mailgun.org"
              />
              <Input
                label="SMTP Port"
                value={form['secret.notification.smtpPort']}
                onChange={(e) => setForm({ ...form, 'secret.notification.smtpPort': e.target.value })}
                placeholder="465 หรือ 587"
              />
              <Input
                label="SMTP Username / Email"
                containerClassName="sm:col-span-2"
                value={form['secret.notification.smtpUser']}
                onChange={(e) => setForm({ ...form, 'secret.notification.smtpUser': e.target.value })}
                placeholder="your-email@example.com"
              />
              <div className="relative">
                <Input
                  label="SMTP Password"
                  type={showSmtpPassword ? 'text' : 'password'}
                  value={form['secret.notification.smtpPassword']}
                  onChange={(e) => setForm({ ...form, 'secret.notification.smtpPassword': e.target.value })}
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  className="absolute right-3.5 top-[35px] text-[#7c543c]/60 hover:text-[#7c543c]"
                >
                  {showSmtpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {activePreview === 'email' && (
            <div className="mt-5 rounded-2xl overflow-hidden border border-blue-200">
              <div className="px-3 py-2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} />
                ตัวอย่างอีเมล
              </div>
              <div className="p-1 bg-stone-50">
                <div className="bg-white border border-stone-200 rounded-xl p-4 text-sm">
                  <div className="mb-2 pb-2 border-b border-stone-100">
                    <span className="text-[10px] font-black text-stone-400">หัวเรื่อง: </span>
                    <span className="text-xs font-bold text-stone-700">
                      {form['notification.msg.email.subject']
                        .replace(/\{ชื่อ\}/g, 'สมศร')
                        .replace(/\{หัวข้อ\}/g, 'โปรโมชั่นเดือนมิถุนายน')}
                    </span>
                  </div>
                  <div
                    className="text-xs text-stone-600 max-h-[200px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html:
                      form['notification.msg.email.body']
                        .replace(/\{ชื่อ\}/g, 'สมศร')
                        .replace(/\{หัวข้อ\}/g, 'โปรโมชั่นเดือนมิถุนายน')
                        .replace(/\{รายละเอียด\}/g, 'ซื้อครบชุดรับส่วนลด 30%')
                        .replace(/\{ลิงก์\}/g, 'https://app.456coffee.com/promo')
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {dirty && (
        <div className="rounded-xl p-3.5 flex items-center gap-3" style={{ background: 'var(--accent-soft)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--accent)' }} />
          <p className="text-sm flex-1 font-extrabold text-[#7c543c]">
            มีการเปลี่ยนแปลงการตั้งค่าการแจ้งเตือนที่ยังไม่ได้บันทึก
          </p>
          <Button size="sm" onClick={handleSaveClick} loading={saving}>บันทึกทั้งหมด</Button>
        </div>
      )}
    </div>
  );
}
