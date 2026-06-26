# 456 Coffee Ecosystem - Quick Links Reference

**สำคัญ:** ต้องรันคำสั่ง `npm run start:dev` ในแต่ละโฟลเดอร์ก่อนจะเข้าลิ๊งค์ได้

---

## 🚀 ลิ๊งค์เข้าหน้าเว็บทั้งหมด

### ✅ ใช้งานได้ (Ready to Use)

**Backend API Server (Port 3000)**
```
🔗 http://localhost:3000
📝 API Endpoints: http://localhost:3000/api
🔌 WebSocket: ws://localhost:3000
```

**Translator Service (Port 5176)** 
```
🔗 http://localhost:5176
✨ No errors - Ready to use
```

---

### 🟡 ต้องแก้ไขก่อน (Needs Fixes)

**Admin HQ Dashboard (Port 5173)**
```
🔗 http://localhost:5173
📊 Dashboard, Branch Management, Orders
❌ 20 TypeScript errors - ต้องแก้ไข
```

**Branch POS System (Port 5174)**
```
🔗 http://localhost:5174
🛒 Point of Sale, Kitchen Display, Dispatch
❌ 30+ TypeScript errors - ต้องแก้ไข
```

**Buyer LIFF App (Port 5175)**
```
🔗 http://localhost:5175
📱 Customer App, Shopping Cart, Orders
❌ Critical errors - ต้องแก้ไขก่อน
```

---

## 📊 สรุปลิ๊งค์

| ชื่อ | ลิ๊งค์ | ประเภท | สถานะ |
|------|------|--------|------|
| Backend API | http://localhost:3000 | API Server | ✅ Ready |
| Admin HQ | http://localhost:5173 | Dashboard | 🟡 Fixing |
| Branch POS | http://localhost:5174 | POS System | 🟡 Fixing |
| Buyer LIFF | http://localhost:5175 | Customer App | 🔴 Fixing |
| Translator | http://localhost:5176 | Translation | ✅ Ready |

---

## 🎯 คำสั่งเริ่มต้น

### เปิด Backend ก่อน (Terminal 1)
```bash
cd backend
npm run start:dev
```

### เปิด Frontend แต่ละตัว (Terminal 2-6)

**Admin HQ:**
```bash
cd frontend/admin-hq
npm run dev
```

**Branch POS:**
```bash
cd frontend/branch-pos
npm run dev
```

**Buyer LIFF:**
```bash
cd frontend/buyer-liff
npm run dev
```

**Translator:**
```bash
cd frontend/translator
npm run dev
```

---

## 🌐 API Endpoints ตัวอย่าง

```
GET    http://localhost:3000/api/branches
GET    http://localhost:3000/api/products
GET    http://localhost:3000/api/orders
GET    http://localhost:3000/api/menus
GET    http://localhost:3000/api/users
```

---

## 📱 ทดลองบน Mobile

ทั้งหมดรองรับ responsive design:
```
1. กด F12 (Windows) หรือ Cmd+Option+I (Mac)
2. กด device toggle icon
3. เลือก iPhone หรือ Android
```

---

## 🗄️ Database Browser

```bash
cd backend
npx prisma studio
```
ไปที่ **http://localhost:5555**

---

## 🔗 อื่นๆ

- **ดูข้อมูลทั้งหมด:** WEB_LINKS.md
- **ปัญหาการแก้ไข:** ISSUE_RESOLUTION_GUIDE.md
- **สถาปัตยกรรม:** ARCHITECTURE.md
- **รายละเอียดการทดสอบ:** TEST_REPORT.md

---

**อัปเดต:** 10 เมษายน 2569

