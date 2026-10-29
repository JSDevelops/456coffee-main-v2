# 456 Coffee Ecosystem - Complete Web Links Guide

**สำคัญ:** ต้องเปิด Backend ก่อน แล้วเปิดแต่ละ Frontend  
**Date:** 10 เมษายน 2569

---

## 🚀 How to Start (คำสั่งเริ่มต้น)

### Step 1: Start Backend Server
```bash
cd backend
npm run start:dev
```
**Status:** ✅ Backend ready at port 3000

### Step 2: Start Each Frontend (Open in separate terminals)
```bash
# Admin HQ
cd frontend/admin-hq
npm run dev

# Branch POS
cd frontend/branch-pos
npm run dev

# Buyer LIFF
cd frontend/buyer-liff
npm run dev

# Translator
cd frontend/translator
npm run dev
```

---

## 🌐 All Web Application Links

### 1. Backend API Server
**Purpose:** REST API & WebSocket Server
```
Main URL:     http://localhost:3000
API Base:     http://localhost:3000/api
WebSocket:    ws://localhost:3000
Status:       Development Mode
Port:         3000
```

**Endpoints ตัวอย่าง:**
- GET `/api/branches` - Get all branches
- GET `/api/products` - Get all products
- GET `/api/orders` - Get all orders
- GET `/api/menus` - Get all menus

---

### 2. Admin HQ Dashboard
**Purpose:** Management Dashboard for Admin
**Status:** 🟡 Needs fixes before production

```
URL:          http://localhost:5173
Development:  npm run dev (from frontend/admin-hq)
Build:        npm run build
Preview:      npm run preview
Base Path:    /456cafe/admin/
```

**Features:**
- 📊 Dashboard overview
- 🏢 Branch management
- 👥 Staff management
- 📦 Product management
- 📋 Order monitoring
- 📈 Reports & Analytics
- 🍽️ Menu management
- 👤 Customer management

**Keyboard Shortcut:**
```
Ctrl+Shift+K     → Developer Tools
```

---

### 3. Branch POS System
**Purpose:** Point of Sale System for Branches
**Status:** 🟡 Needs fixes before production

```
URL:          http://localhost:5174
Development:  npm run dev (from frontend/branch-pos)
Build:        npm run build
```

**Features:**
- 🛒 Order creation
- ☕ Kitchen display system (KDS)
- 📥 Queue monitoring
- ✅ Quality control
- 📤 Order dispatch
- 👨‍💼 Role-based views:
  - Barista view
  - Cashier/POS view
  - Dispatch view
  - QC view
  - Queue monitor

---

### 4. Buyer LIFF (Customer App)
**Purpose:** Customer-facing Mobile App (LINE LIFF)
**Status:** 🔴 Has critical errors (needs fixes)

```
URL:          http://localhost:5175
Development:  npm run dev (from frontend/buyer-liff)
Build:        npm run build
Platform:     LINE LIFF
Mobile:       ✅ Responsive design
```

**Features:**
- 📱 Product browsing
- 🛍️ Shopping cart
- 🛒 Order placement
- 💳 Payment
- 📜 Order history
- 👤 Customer profile
- 🔐 LINE authentication

**Production URL (after deployment):**
```
https://liff.line.me/YOUR_LIFF_ID
```

---

### 5. Translator Service
**Purpose:** Multi-language Translation Service
**Status:** ✅ Ready to use (no errors)

```
URL:          http://localhost:5176
Development:  npm run dev (from frontend/translator)
Build:        npm run build
```

**Features:**
- 🌐 Language translation
- 📝 Text localization
- 🎯 Multi-language support
- Languages:
  - Thai (ไทย) - Default
  - English (ENG)
  - More available

---

## 📊 Quick Access Chart

| Service | URL | Port | Status | Features |
|---------|-----|------|--------|----------|
| **Backend API** | http://localhost:3000 | 3000 | ✅ Ready | REST API, WebSocket |
| **Admin HQ** | http://localhost:5173 | 5173 | 🟡 Fixing | Dashboard, Management |
| **Branch POS** | http://localhost:5174 | 5174 | 🟡 Fixing | POS, KDS, Dispatch |
| **Buyer LIFF** | http://localhost:5175 | 5175 | 🔴 Fixing | Customer App |
| **Translator** | http://localhost:5176 | 5176 | ✅ Ready | Translation Service |

---

## 🔗 API Endpoints Reference

### Branch Endpoints
```
GET    /api/branches           → List all branches
GET    /api/branches/:id       → Get branch details
POST   /api/branches           → Create new branch
PATCH  /api/branches/:id       → Update branch
DELETE /api/branches/:id       → Delete branch
```

### Product Endpoints
```
GET    /api/products           → List all products
GET    /api/products/:id       → Get product details
POST   /api/products           → Create new product
PATCH  /api/products/:id       → Update product
DELETE /api/products/:id       → Delete product
```

### Order Endpoints
```
GET    /api/orders             → List all orders
GET    /api/orders/:id         → Get order details
POST   /api/orders             → Create new order
PATCH  /api/orders/:id         → Update order
PATCH  /api/orders/:id/status  → Update order status
DELETE /api/orders/:id         → Cancel order
POST   /api/orders/:id/payment → Process payment
```

### Menu Endpoints
```
GET    /api/menus              → List all menus
GET    /api/menus/:id          → Get menu details
POST   /api/menus              → Create new menu
PATCH  /api/menus/:id          → Update menu
DELETE /api/menus/:id          → Delete menu
```

### User Endpoints
```
GET    /api/users              → List all users
GET    /api/users/:id          → Get user details
POST   /api/users              → Create new user
PATCH  /api/users/:id          → Update user
DELETE /api/users/:id          → Delete user
```

### Auth Endpoints
```
POST   /api/auth/login         → User login
POST   /api/auth/logout        → User logout
POST   /api/auth/register      → User registration
POST   /api/auth/refresh       → Refresh token
```

### Inventory Endpoints
```
GET    /api/inventory          → Get inventory
GET    /api/inventory/:branchId/:productId → Get item stock
PATCH  /api/inventory/:id      → Update stock
POST   /api/inventory/adjust   → Adjust stock levels
```

### Address Endpoints
```
GET    /api/addresses          → List all addresses
GET    /api/addresses/:id      → Get address details
POST   /api/addresses          → Create new address
PATCH  /api/addresses/:id      → Update address
DELETE /api/addresses/:id      → Delete address
```

---

## 💻 Testing API Endpoints

### Using cURL
```bash
# Get all branches
curl http://localhost:3000/api/branches

# Get specific branch
curl http://localhost:3000/api/branches/1

# Get all products
curl http://localhost:3000/api/products

# Get all orders
curl http://localhost:3000/api/orders
```

### Using Postman
1. Download Postman: https://www.postman.com/downloads/
2. Create new request
3. Set method to GET/POST
4. Enter URL: `http://localhost:3000/api/endpoints`
5. Click Send

### Using VS Code REST Client
Create a file `test.http`:
```
GET http://localhost:3000/api/branches

### Get products
GET http://localhost:3000/api/products

### Create order
POST http://localhost:3000/api/orders
Content-Type: application/json

{
  "branchId": "1",
  "userId": "1",
  "items": []
}
```

---

## 🔄 Real-time Communication (WebSocket)

### WebSocket Events
```typescript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Order Events
socket.on('order:created', (order) => { ... })
socket.on('order:updated', (order) => { ... })
socket.on('order:status_changed', (data) => { ... })
socket.on('order:completed', (order) => { ... })

// Queue Events
socket.on('queue:updated', (queueData) => { ... })
socket.on('queue:clear', () => { ... })

// Inventory Events
socket.on('inventory:low_stock', (product) => { ... })
socket.on('inventory:updated', (inventory) => { ... })
```

---

## 🔐 Authentication

### Login Flow
```bash
# 1. Register (if new user)
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# 2. Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { ... }
}

# 3. Use token in headers
Authorization: Bearer eyJhbGc...
```

---

## 📱 Mobile View

All frontends support mobile/responsive design:

```
Desktop:  http://localhost:5173 (full width)
Tablet:   Press F12 → Toggle device toolbar
Mobile:   iPhone 12 / Android resolution
```

### Test Mobile View in Browser
1. Press `F12` (Windows) or `Cmd+Option+I` (Mac)
2. Click device toggle icon (top-left of DevTools)
3. Select device or set custom resolution

---

## 🗄️ Database Access

### Prisma Studio (Visual Database Browser)
```bash
cd backend
npx prisma studio
```
**URL:** http://localhost:5555

**Features:**
- View all database tables
- Browse records
- Add/Edit/Delete data
- Visual relationships

---

## 📝 Environment Variables

### Backend (.env)
```
NODE_ENV=development
DATABASE_URL=file:./dev.db
API_PORT=3000
API_HOST=localhost

# Optional
GOOGLE_AI_API_KEY=your_key_here
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill process (Mac/Linux)
kill -9 <PID>

# Or use different port
npm run dev -- --port 3001
```

### Cannot Connect to API
```bash
# Check backend is running
curl http://localhost:3000

# Check CORS configuration
# Make sure frontend URL is whitelisted

# Check firewall
sudo ufw allow 3000
```

### WebSocket Connection Failed
```bash
# Check backend is running with WebSocket support
# Check firewall allows WebSocket
# Check CORS headers
```

### Build Errors
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📊 Network Diagram

```
┌─────────────────┐
│   Browser       │
│ (Admin HQ)      │
│ :5173           │
└────────┬────────┘
         │
         │ HTTP + WebSocket
         │
┌────────▼────────┐
│  Backend API    │
│  NestJS         │
│  :3000          │
└────────┬────────┘
         │
         │
    ┌────▼────┐
    │ SQLite  │
    │ dev.db  │
    └─────────┘
```

---

## 🎯 Quick Start Commands

```bash
# Terminal 1: Backend
cd backend
npm install
npm run start:dev

# Terminal 2: Admin HQ
cd frontend/admin-hq
npm install
npm run dev

# Terminal 3: Branch POS
cd frontend/branch-pos
npm install
npm run dev

# Terminal 4: Buyer LIFF
cd frontend/buyer-liff
npm install
npm run dev

# Terminal 5: Translator
cd frontend/translator
npm install
npm run dev
```

---

## 📋 Checklist Before Going Live

- [ ] Backend starts without errors
- [ ] All frontends build successfully
- [ ] API endpoints respond correctly
- [ ] WebSocket connects
- [ ] Database has sample data
- [ ] Authentication works
- [ ] All forms submit data
- [ ] Real-time updates work
- [ ] Mobile view responsive
- [ ] No console errors

---

## 🎓 Learning Resources

### API Documentation
```
Swagger/OpenAPI:  (To be implemented)
API Base URL:     http://localhost:3000/api
WebSocket:        ws://localhost:3000
```

### Framework Documentation
- **NestJS:** https://nestjs.com
- **React:** https://react.dev
- **Vite:** https://vitejs.dev
- **Prisma:** https://www.prisma.io
- **Socket.io:** https://socket.io

---

## 📞 Support & Help

For issues, check:
1. **TEST_REPORT.md** - Test results
2. **ISSUE_RESOLUTION_GUIDE.md** - How to fix issues
3. **ARCHITECTURE.md** - System design
4. **QUICK_START.md** - Getting started

---

## ⚡ Performance Tips

### Speed Up Frontend Load
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Disable browser extensions
3. Use incognito/private mode
4. Check network speed: DevTools → Network tab

### Optimize Backend
1. Enable caching
2. Use database indexes
3. Optimize queries
4. Monitor with DevTools

### Monitor Performance
```bash
# Frontend bundle size
npm run build
# Check dist/ folder size

# Backend performance
npm run test:cov
# Check coverage report
```

---

**Generated:** 10 เมษายน 2569  
**Project:** 456 Coffee Ecosystem v1.0  
**Status:** Ready for Development & Testing

