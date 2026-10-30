import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from './prisma.service';
import { SettingService } from './setting.service';

export interface OrderNotificationPayload {
  id: string;
  orderNo: string;
  queueNo: number;
  totalAmount: number;
  status: string;
  customerUid?: string | null;
  customerName?: string | null;
  userId?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  branch?: {
    id: string;
    name: string;
    location?: string | null;
    phone?: string | null;
  } | null;
  items?: Array<{
    quantity: number;
    productName?: string | null;
    name?: string | null;
    price: number;
  }> | null;
}

@Injectable()
export class LineNotificationService {
  private readonly logger = new Logger(LineNotificationService.name);
  private readonly linePushUrl = 'https://api.line.me/v2/bot/message/push';

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingService: SettingService,
  ) {}

  /**
   * Retrieves the LINE Channel Access Token from DB settings or process.env.
   */
  async getChannelAccessToken(): Promise<string | null> {
    const fromEnv = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (fromEnv && fromEnv.trim()) return fromEnv.trim();

    try {
      const fromSettings = await this.settingService.getOne('secret.notification.lineToken');
      if (fromSettings && fromSettings.trim()) return fromSettings.trim();
    } catch (err) {
      this.logger.warn(`Failed to read lineToken from settings: ${err}`);
    }

    return null;
  }

  /**
   * Resolves the LINE user ID for a given order.
   * Priority:
   * 1. If order.customerUid starts with 'U' and length is 33, it is a LINE User ID.
   * 2. If order.userId is present, find user's AuthProvider where provider = 'LINE'.
   */
  async resolveLineUid(order: OrderNotificationPayload): Promise<string | null> {
    if (order.customerUid && /^U[0-9a-fA-F]{32}$/.test(order.customerUid)) {
      return order.customerUid;
    }

    if (order.userId) {
      try {
        const auth = await this.prisma.authProvider.findFirst({
          where: {
            userId: order.userId,
            provider: 'LINE',
          },
          select: { providerId: true },
        });
        if (auth?.providerId && /^U[0-9a-fA-F]{32}$/.test(auth.providerId)) {
          return auth.providerId;
        }
      } catch (err) {
        this.logger.warn(`Could not lookup AuthProvider for user ${order.userId}: ${err}`);
      }
    }

    return null;
  }

  /**
   * Send notification when an order is created / confirmed.
   */
  async sendOrderCreated(order: OrderNotificationPayload): Promise<boolean> {
    const lineUid = await this.resolveLineUid(order);
    if (!lineUid) return false;

    const token = await this.getChannelAccessToken();
    if (!token) {
      this.logger.debug(`LINE Channel Access Token not configured. Skipping order created notification.`);
      return false;
    }

    const branchName = order.branch?.name || '456 Coffee Atelier';
    const queueText = order.queueNo > 0 ? `#${order.queueNo}` : '—';
    const totalText = `฿${Number(order.totalAmount || 0).toLocaleString()}`;
    const itemsSummary = (order.items || [])
      .map((it) => `${it.productName || it.name || 'เครื่องดื่ม'} × ${it.quantity}`)
      .slice(0, 5)
      .join('\n');

    const altText = `☕ 456 Coffee — รับคำสั่งซื้อคิวที่ ${queueText} เรียบร้อยแล้ว`;

    const flexContent = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#2d241e',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: '456 COFFEE ATELIER',
            color: '#d4a968',
            size: 'xs',
            weight: 'bold',
            letterSpacing: '2px',
          },
          {
            type: 'text',
            text: 'รับคำสั่งซื้อแล้ว ☕',
            color: '#ffffff',
            size: 'lg',
            weight: 'bold',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        backgroundColor: '#fdfaf6',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: 'ลำดับคิว / QUEUE', size: 'xxs', color: '#7c543c', weight: 'bold' },
                  { type: 'text', text: queueText, size: '3xl', weight: 'bold', color: '#ea580c' },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                alignItems: 'flex-end',
                contents: [
                  { type: 'text', text: 'หมายเลขออเดอร์', size: 'xxs', color: '#8b8275' },
                  { type: 'text', text: `#${order.orderNo}`, size: 'xs', weight: 'bold', color: '#2d241e' },
                  { type: 'text', text: branchName, size: 'xxs', color: '#7c543c', margin: 'xs' },
                ],
              },
            ],
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#ece5da',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              { type: 'text', text: 'รายการสินค้า', size: 'xxs', color: '#8b8275', weight: 'bold' },
              {
                type: 'text',
                text: itemsSummary || 'รายการเครื่องดื่ม',
                size: 'xs',
                color: '#2d241e',
                wrap: true,
                margin: 'xs',
              },
            ],
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#ece5da',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: 'ยอดสุทธิ', size: 'xs', color: '#7c543c', weight: 'bold' },
              { type: 'text', text: totalText, size: 'base', color: '#ea580c', weight: 'bold', align: 'end' },
            ],
          },
          {
            type: 'text',
            text: 'บาริสต้ากำลังจัดเตรียมเครื่องดื่มให้คุณอย่างพิถีพิถัน ☕',
            size: 'xxs',
            color: '#8b8275',
            margin: 'md',
            align: 'center',
          },
        ],
      },
    };

    const textFallback = `☕ 456 Coffee Atelier\n✅ รับคำสั่งซื้อเรียบร้อยแล้ว\nลำดับคิว: ${queueText}\nเลขออเดอร์: #${order.orderNo}\nสาขา: ${branchName}\nยอดสุทธิ: ${totalText}\n\nบาริสต้ากำลังจัดเตรียมเครื่องดื่มให้คุณค่ะ ✨`;

    return this.pushMessage(token, lineUid, altText, flexContent, textFallback);
  }

  /**
   * Send notification when barista marks order as READY / READY_FOR_PICKUP.
   */
  async sendOrderReady(order: OrderNotificationPayload): Promise<boolean> {
    const lineUid = await this.resolveLineUid(order);
    if (!lineUid) return false;

    const token = await this.getChannelAccessToken();
    if (!token) return false;

    const branchName = order.branch?.name || '456 Coffee Atelier';
    const queueText = order.queueNo > 0 ? `#${order.queueNo}` : '—';
    const altText = `🔔 เครื่องดื่มคิวที่ ${queueText} พร้อมรับแล้วค่ะ! (456 Coffee)`;

    const flexContent = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#059669', // Emerald success header
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: '456 COFFEE ATELIER',
            color: '#d1fae5',
            size: 'xs',
            weight: 'bold',
            letterSpacing: '2px',
          },
          {
            type: 'text',
            text: 'เครื่องดื่มพร้อมรับแล้ว! 🎉',
            color: '#ffffff',
            size: 'lg',
            weight: 'bold',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        backgroundColor: '#fdfaf6',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            alignItems: 'center',
            contents: [
              { type: 'text', text: 'ลำดับคิวของคุณ', size: 'xs', color: '#7c543c', weight: 'bold' },
              { type: 'text', text: queueText, size: '4xl', weight: 'bold', color: '#059669', margin: 'xs' },
              { type: 'text', text: `ออเดอร์ #${order.orderNo}`, size: 'xxs', color: '#8b8275', margin: 'xs' },
            ],
          },
          {
            type: 'separator',
            margin: 'lg',
            color: '#ece5da',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            contents: [
              { type: 'text', text: '📍 จุดรับเครื่องดื่ม', size: 'xs', color: '#2d241e', weight: 'bold' },
              { type: 'text', text: branchName, size: 'xs', color: '#7c543c', margin: 'xs' },
              {
                type: 'text',
                text: 'กรุณาแสดงหน้าจอนี้หรือแจ้งหมายเลขคิวที่เคาน์เตอร์',
                size: 'xxs',
                color: '#8b8275',
                margin: 'xs',
                wrap: true,
              },
            ],
          },
        ],
      },
    };

    const textFallback = `🔔 456 Coffee Atelier\n🎉 เครื่องดื่มของคุณพร้อมรับแล้วค่ะ!\nลำดับคิว: ${queueText} (ออเดอร์ #${order.orderNo})\nสาขา: ${branchName}\n\nเชิญรับเครื่องดื่มที่เคาน์เตอร์ได้เลยค่ะ ขอบคุณค่ะ ☕`;

    return this.pushMessage(token, lineUid, altText, flexContent, textFallback);
  }

  /**
   * Send notification when delivery order is dispatched with rider.
   */
  async sendOrderDispatched(order: OrderNotificationPayload): Promise<boolean> {
    const lineUid = await this.resolveLineUid(order);
    if (!lineUid) return false;

    const token = await this.getChannelAccessToken();
    if (!token) return false;

    const riderName = order.riderName || 'ไรเดอร์';
    const riderPhone = order.riderPhone ? `โทร: ${order.riderPhone}` : 'กำลังเดินทางไปยังที่อยู่ของคุณ';
    const altText = `🛵 ออเดอร์ #${order.orderNo} กำลังจัดส่งแล้วค่ะ!`;

    const flexContent = {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#3730a3',
        paddingAll: '18px',
        contents: [
          {
            type: 'text',
            text: '456 COFFEE DELIVERY',
            color: '#c7d2fe',
            size: 'xs',
            weight: 'bold',
            letterSpacing: '2px',
          },
          {
            type: 'text',
            text: 'กำลังนำส่งเครื่องดื่ม 🛵',
            color: '#ffffff',
            size: 'lg',
            weight: 'bold',
            margin: 'xs',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        backgroundColor: '#fdfaf6',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: `ออเดอร์ #${order.orderNo}`, size: 'sm', weight: 'bold', color: '#2d241e' },
              { type: 'text', text: `ผู้จัดส่ง: ${riderName}`, size: 'xs', color: '#4338ca', margin: 'xs', weight: 'bold' },
              { type: 'text', text: riderPhone, size: 'xs', color: '#6b7280', margin: 'xs' },
            ],
          },
        ],
      },
    };

    const textFallback = `🛵 456 Coffee Delivery\nออเดอร์ #${order.orderNo} กำลังจัดส่งค่ะ!\nผู้จัดส่ง: ${riderName} (${riderPhone})\n\nเตรียมรอรับเครื่องดื่มแสนอร่อยได้เลยค่ะ ☕`;

    return this.pushMessage(token, lineUid, altText, flexContent, textFallback);
  }

  /**
   * Low-level helper to send push message with Flex + Text fallback.
   */
  private async pushMessage(
    token: string,
    to: string,
    altText: string,
    flexBubble: any,
    fallbackText: string,
  ): Promise<boolean> {
    try {
      await axios.post(
        this.linePushUrl,
        {
          to,
          messages: [
            {
              type: 'flex',
              altText,
              contents: flexBubble,
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        },
      );
      this.logger.log(`LINE push sent successfully to ${to}`);
      return true;
    } catch (err: any) {
      this.logger.warn(`Flex push failed for ${to}: ${err.response?.data?.message || err.message}. Retrying with plain text.`);
      try {
        await axios.post(
          this.linePushUrl,
          {
            to,
            messages: [{ type: 'text', text: fallbackText }],
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000,
          },
        );
        this.logger.log(`LINE plain text push sent successfully to ${to}`);
        return true;
      } catch (fallbackErr: any) {
        this.logger.error(`LINE text push also failed for ${to}: ${fallbackErr.response?.data?.message || fallbackErr.message}`);
        return false;
      }
    }
  }
}
