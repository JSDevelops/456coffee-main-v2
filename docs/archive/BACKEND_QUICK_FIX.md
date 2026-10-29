# 🚨 QUICK FIX: Backend ไม่ทำงาน

## 🎯 ทำตามนี้ทีละขั้น:

### **ขั้น 1: เปิด Terminal ใหม่**
```bash
cd "/Users/3designs/456 Coffee/456 Coffee Ecosystem (Version 1.0)/backend"
```

### **ขั้น 2: ติดตั้ง Dependencies (ถ้ายังไม่ได้)**
```bash
npm install
```
⏰ รอประมาณ 5-10 นาที

### **ขั้น 3: ตรวจสอบ Database**
```bash
npx prisma migrate deploy
npx prisma db seed
```

### **ขั้น 4: เริ่ม Backend**
```bash
npm run start:dev
```

### **ขั้น 5: ตรวจสอบว่ามันทำงานหรือไม่**
ในอีก Terminal ใหม่:
```bash
curl http://localhost:3000/api/branches
```

---

## ✅ ถ้าสำเร็จ

ควรจะเห็น:
```json
[{...branch data...}]
```

---

## ❌ ถ้ายังไม่ได้

ลองสั่ง:
```bash
# ล้าง cache
npm cache clean --force

# ลบ node_modules
rm -rf node_modules package-lock.json

# ติดตั้งใหม่
npm install

# เริ่มใหม่
npm run start:dev
```

---

## 📞 Issue บ่อยๆ:

| ปัญหา | วิธีแก้ |
|------|--------|
| **Port 3000 already in use** | `kill -9 $(lsof -ti :3000)` |
| **Cannot find module** | `npm install` |
| **DB not found** | `npx prisma migrate deploy` |
| **node_modules missing** | `npm install` |

---

**See: BACKEND_TROUBLESHOOTING.md สำหรับรายละเอียดเพิ่มเติม**

