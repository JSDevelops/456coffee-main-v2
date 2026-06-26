import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Defaults applied if a key is missing in the DB. Keep in sync with
 * the Settings UI in admin-hq so the frontend never sees `undefined`.
 */
export const DEFAULT_SETTINGS: Record<string, string> = {
  'font.family': 'Prompt',
  'payment.promptpayId': '',
  'payment.promptpayName': '',
  'payment.qrExpiryMinutes': '15',
  'payment.matchWindowMinutes': '180',
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
  'notification.channels': 'IN_APP',
  'secret.notification.lineToken': '',
  'secret.notification.smtpHost': '',
  'secret.notification.smtpPort': '',
  'secret.notification.smtpUser': '',
  'secret.notification.smtpPassword': '',
  // Notification message templates (use {ชื่อ}, {หัวข้อ}, {รายละเอียด}, {ลิงก์} as placeholders)
  'notification.msg.inapp.title': '🔔 ข่าวสารใหม่จาก 456 Coffee',
  'notification.msg.inapp.body': 'สวัสดีคุณ {ชื่อ}! มีข่าวสารและโปรโมชั่นพิเศษสำหรับคุณ 🎉\n{หัวข้อ}\n{รายละเอียด}',
  'notification.msg.line.text': '☕ สวัสดีคุณ {ชื่อ}!\n\n🎁 มีข่าวสาร/โปรโมชั่นใหม่จาก 456 Coffee!\n\n📌 {หัวข้อ}\n📄 {รายละเอียด}\n\n{ลิงก์}\n\n— ทีมงาน 456 Coffee Atelier',
  'notification.msg.email.subject': '[456 Coffee] {หัวข้อ}',
  'notification.msg.email.body': '<h2 style="color:#ea580c">☕ 456 Coffee Atelier</h2>\n<p>สวัสดีคุณ <strong>{ชื่อ}</strong>,</p>\n<p>{รายละเอียด}</p>\n<p><a href="{ลิงก์}" style="background:#ea580c;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">ดูรายละเอียดเพิ่มเติม</a></p>\n<hr/>\n<small>ส่งโดย 456 Coffee Atelier · ยกเลิกการแจ้งเตือนได้ในแอพ</small>',
};

/**
 * Keys with these prefixes are server-only and never returned by the
 * public settings endpoint (e.g. password hashes, admin profile).
 */
export const PRIVATE_SETTING_PREFIXES = ['admin.', 'secret.'];

function isPrivateKey(key: string): boolean {
  return PRIVATE_SETTING_PREFIXES.some((p) => key.startsWith(p));
}

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  /** Return all settings (including private). For server-side use. */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    const merged: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const r of rows) merged[r.key] = r.value;
    return merged;
  }

  /** Public-safe settings — strips keys with private prefixes. */
  async getPublic(): Promise<Record<string, string>> {
    const all = await this.getAll();
    const safe: Record<string, string> = {};
    for (const [k, v] of Object.entries(all)) {
      if (!isPrivateKey(k)) safe[k] = v;
    }
    return safe;
  }

  async getOne(key: string): Promise<string | null> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row?.value ?? DEFAULT_SETTINGS[key] ?? null;
  }

  async setOne(key: string, value: string) {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async setMany(updates: Record<string, string>) {
    // Reject private-prefixed keys — those flow through dedicated endpoints.
    for (const k of Object.keys(updates)) {
      if (isPrivateKey(k)) {
        throw new Error(`Setting key "${k}" is private and cannot be set here`);
      }
    }
    const ops = Object.entries(updates).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );
    await this.prisma.$transaction(ops);
    return this.getPublic();
  }

  async setManyAdmin(updates: Record<string, string>) {
    const ops = Object.entries(updates).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );
    await this.prisma.$transaction(ops);
    return this.getAll();
  }
}
