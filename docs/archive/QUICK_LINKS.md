# 456 Coffee Ecosystem - Quick Links Reference

เอกสารสรุปลิงก์การใช้งานทั้งระดับ **Production (ออนไลน์)** และ **Local Development (เครื่องพัฒนา)**

---

## 🌐 1. ลิงก์ระบบออนไลน์ (Production Links)

| บริการ / แพลตฟอร์ม | ลิงก์ออนไลน์ | โฮสติ้ง | สถานะ |
|---|---|---|---|
| **Admin HQ Dashboard** | 🔗 **https://465coffee.vercel.app** | Vercel | ✅ พร้อมใช้งาน |
| **Backend REST & WS API** | 🔗 **https://api.cafe-coffee.shop/api** | Railway | ✅ พร้อมใช้งาน |
| **Backend Healthcheck** | 🔗 **https://api.cafe-coffee.shop/api/health** | Railway | ✅ Status: OK |
| **GitHub Repository** | 🔗 **https://github.com/JSDevelops/456coffee-main-v2** | GitHub | ✅ Active |

---

## 💻 2. ลิงก์สำหรับพัฒนาในเครื่อง (Local Development)

| บริการ | ลิงก์ในเครื่อง | พอร์ต | คำสั่งเปิดเฉพาะส่วน |
|---|---|---|---|
| **Backend API** | http://localhost:5001/api | `5001` | `npm --prefix backend run start:dev` |
| **Admin HQ** | http://localhost:5173 | `5173` | `npm --prefix frontend/admin-hq run dev` |
| **Branch POS** | http://localhost:5174 | `5174` | `npm --prefix frontend/branch-pos run dev` |
| **Buyer LIFF** | http://localhost:5175 | `5175` | `npm --prefix frontend/buyer-liff run dev` |
| **Translator** | http://localhost:5176 | `5176` | `npm --prefix frontend/translator run dev` |
| **Prisma Studio (DB GUI)**| http://localhost:5555 | `5555` | `npm --prefix backend run prisma:studio` |

---

## 🚀 3. คำสั่งลัดใช้งานบ่อย (Root Project)

```bash
# 1. เปิดทุกระบบพร้อมกัน (Backend + Admin + POS + LIFF + Translator)
npm run dev:full

# 2. เปิดเฉพาะ Backend + Admin HQ
npm run dev

# 3. แบคอัปฐานข้อมูล PostgreSQL ทั้งหมดทันที
npm run db:backup

# 4. ทดสอบความถูกต้องของ Backend
npm run test:api

# 5. คอมไพล์โปรเจกต์ Backend
npm run build:api
```

---

## 🗄️ 4. ข้อมูลฐานข้อมูล (Database)

* **Engine:** PostgreSQL 16
* **Database Name:** `cafe`
* **Local Connection:** `postgresql://cafe:cafepw@localhost:5432/cafe?schema=public`
* **Backup Location:** โฟลเดอร์ `backups/` (สร้างอัตโนมัติด้วยคำสั่ง `npm run db:backup`)

---

## 📱 5. แอป Android Payment Forwarder

* **โฟลเดอร์โปรเจกต์:** `android/payment-forwarder`
* **หน้าที่:** ดักจับ SMS และ Push Notification จากแอปธนาคาร (SCB, KBank, KTB, BBL, TrueMoney ฯลฯ) แล้วส่งเข้า Backend เพื่อตัดยอดออเดอร์อัตโนมัติ
* **API Server เริ่มต้น:** `https://api.cafe-coffee.shop` (สามารถระบุหรือเปลี่ยนได้ที่หน้าจอเข้าสู่ระบบของแอป)
