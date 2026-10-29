# 🔧 Troubleshooting Backend Connection - http://localhost:3000

**ปัญหา:** ไม่สามารถเข้า http://localhost:3000 ได้

---

## ✅ ขั้นตอนการแก้ปัญหา

### **ขั้นที่ 1: ตรวจสอบว่า Backend กำลังรันหรือไม่**

```bash
# ดูว่า port 3000 มี process ใช้งานหรือไม่
lsof -i :3000

# ผลลัพธ์ที่ควรได้:
# node    12345  user   10u  IPv4 0x...  0t0  TCP localhost:3000 (LISTEN)
```

**ถ้าไม่มี output = Backend ยังไม่ได้เปิด** → ไปขั้นที่ 2

---

### **ขั้นที่ 2: ติดตั้ง Dependencies**

```bash
cd backend
npm install
```

**รอให้เสร็จเรียบร้อย** (อาจใช้เวลาหลายนาที)

---

### **ขั้นที่ 3: ตรวจสอบ Database**

```bash
# ดูว่า dev.db มี data หรือไม่
ls -la prisma/dev.db

# ถ้าไม่มี ให้สร้าง
npx prisma migrate deploy
npx prisma db seed
```

---

### **ขั้นที่ 4: เริ่ม Backend Server**

```bash
# ตำแหน่ง: /backend
npm run start:dev
```

**ผลลัพธ์ที่ควรได้:**
```
[Nest] 12345  - 04/10/2025, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 04/10/2025, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 04/10/2025, 10:30:02 AM     LOG [RoutesResolver] AppController {/api}:
[Nest] 12345  - 04/10/2025, 10:30:02 AM     LOG [NestApplication] Nest application successfully started
```

---

## 🔍 ตรวจสอบ Backend กำลังทำงาน

### **วิธี 1: ใช้ cURL**
```bash
curl http://localhost:3000
```

### **วิธี 2: ใช้ Browser**
เปิด browser แล้วไปที่:
```
http://localhost:3000/api/branches
```

### **วิธี 3: ใช้ Postman**
1. สร้าง GET request
2. URL: `http://localhost:3000/api/branches`
3. กด Send

---

## ❌ ถ้า Port 3000 Blocked

### **ปัญหา: Port 3000 ถูก process อื่นใช้งาน**

```bash
# ดูว่า process ไหน
lsof -i :3000

# Kill process (ระวัง!)
kill -9 <PID>

# หรือใช้ port อื่น
npm run start:dev -- --port 3001
```

---

## 🔌 Firewall Issues

### **Mac: ปิด Firewall อาจช่วย**

```bash
# ดูสถานะ Firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw -getglobalstate

# Allow node.js
sudo /usr/libexec/ApplicationFirewall/socketfilterfw -setglobalstate off
```

---

## 📝 Environment Variables

### **ตรวจสอบ .env**

```bash
# Backend ต้องมี .env file
cd backend
cat .env
```

**ถ้าไม่มี .env สร้างใหม่:**

```
NODE_ENV=development
DATABASE_URL=file:./dev.db
API_PORT=3000
API_HOST=localhost
```

---

## 🗄️ Database Issues

### **ถ้า Database มีปัญหา**

```bash
cd backend

# ลบ database เก่า
rm prisma/dev.db

# สร้าง database ใหม่
npx prisma migrate deploy

# เพิ่ม sample data
npx prisma db seed

# ตรวจสอบ
npx prisma studio
```

---

## 📊 ตรวจสอบ Process

```bash
# ดูทุก node process
ps aux | grep node

# ดูใด้ว่า port ไหนเปิดอยู่
netstat -tuln | grep LISTEN

# ตรวจสอบ port 3000 โดยเฉพาะ
netstat -tuln | grep 3000
```

---

## 🐛 Error Messages & Solutions

### **Error: Port 3000 already in use**
```bash
kill -9 $(lsof -ti :3000)
npm run start:dev
```

### **Error: Cannot find module**
```bash
npm install
npm run build
```

### **Error: Database not found**
```bash
npx prisma migrate deploy
npx prisma db seed
```

### **Error: EACCES: permission denied**
```bash
sudo npm run start:dev
```

---

## 🎯 Complete Startup Checklist

```
☐ Navigate to backend directory
☐ Run: npm install
☐ Create/check .env file
☐ Run: npx prisma migrate deploy
☐ Run: npx prisma db seed
☐ Run: npm run build
☐ Run: npm run start:dev
☐ Check: curl http://localhost:3000
☐ Open in browser: http://localhost:3000/api/branches
```

---

## ⏰ Expected Startup Time

```
npm install:           5-10 minutes
Database setup:        10-20 seconds
npm run build:         5-15 seconds
npm run start:dev:     5-10 seconds
Total:                 6-10 minutes (first time)
```

---

## 📱 Test Connection

### **Test 1: Simple HTTP Get**
```bash
curl -v http://localhost:3000
```

### **Test 2: Get Branches**
```bash
curl http://localhost:3000/api/branches
```

### **Test 3: Check WebSocket**
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3000
```

---

## 🔗 Common URLs to Test

```
Main:         http://localhost:3000
API:          http://localhost:3000/api
Branches:     http://localhost:3000/api/branches
Products:     http://localhost:3000/api/products
Orders:       http://localhost:3000/api/orders
Menus:        http://localhost:3000/api/menus
```

---

## 💡 Pro Tips

1. **ทิ้ง node_modules และ reinstall**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **ล้าง npm cache**
   ```bash
   npm cache clean --force
   ```

3. **ใช้ nvm เพื่อ switch Node version**
   ```bash
   nvm list
   nvm use 18
   ```

4. **ตรวจสอบ log ของ Backend**
   ```bash
   npm run start:dev 2>&1 | tee backend.log
   ```

---

## 📞 ถ้ายังไม่ได้ ลองตรวจสอบ:

1. ✅ Node.js & npm เวอร์ชันถูกต้องหรือไม่
   ```bash
   node --version   # ต้อง 18+
   npm --version    # ต้อง 9+
   ```

2. ✅ Port 3000 ไม่ถูก block
   ```bash
   sudo lsof -i :3000
   ```

3. ✅ Database file มีอยู่
   ```bash
   ls -la prisma/dev.db
   ```

4. ✅ .env configuration ถูกต้อง
   ```bash
   cat .env
   ```

---

**Generated:** 10 เมษายน 2569  
**Status:** Troubleshooting Guide

