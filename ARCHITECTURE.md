# 456 Coffee Ecosystem - System Architecture & Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Data Model](#data-model)
6. [API Endpoints](#api-endpoints)
7. [Real-time Communication](#real-time-communication)
8. [Deployment Guide](#deployment-guide)

---

## System Overview

**456 Coffee Ecosystem** is an integrated coffee shop management platform consisting of:

### Core Components

#### 1. Backend API (NestJS)
- RESTful API server
- WebSocket support for real-time updates
- Database abstraction with Prisma ORM
- Business logic layer
- AI integration (Google Generative AI)

#### 2. Frontend Applications

**Admin HQ** (`frontend/admin-hq`)
- Dashboard for management
- Branch management
- Staff management
- Reporting & analytics
- Menu management
- Order monitoring

**Branch POS** (`frontend/branch-pos`)
- Point-of-sale system
- Order creation & management
- Kitchen display system (KDS)
- Queue monitoring
- Quality control interface
- Dispatch management

**Buyer LIFF** (`frontend/buyer-liff`)
- Customer-facing application (LINE LIFF)
- Product browsing
- Order placement
- Payment processing
- Order history & tracking
- Customer authentication

**Translator** (`frontend/translator`)
- Language translation service
- UI text management
- Multi-language support

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐ │
│  │  Admin HQ   │  │ Branch POS   │  │Buyer LIFF│  │Translator │ │
│  │  Dashboard  │  │              │  │ (LINE)   │  │  Service  │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬────┘  └─────┬─────┘ │
│         │                │                │             │         │
│         └────────────────┼────────────────┴─────────────┘         │
│                          │                                         │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
                    WebSocket (Socket.io)
                  & HTTP (REST API)
                           │
┌──────────────────────────┼─────────────────────────────────────────┐
│                          ▼                                           │
│                  ┌───────────────────┐                             │
│                  │  NestJS API       │                             │
│                  │  Server           │                             │
│                  └───────────────────┘                             │
│                          │                                           │
│         ┌────────────────┼────────────────┐                        │
│         │                │                │                        │
│    ┌────▼─────┐    ┌─────▼──────┐    ┌──▼──────────┐             │
│    │Controllers│   │ Services   │    │ Gateways    │             │
│    │           │   │            │    │ (WebSocket) │             │
│    └───────────┘   ├─ Order     │    └─────────────┘             │
│                    ├─ Branch    │                                  │
│                    ├─ Inventory │                                  │
│                    ├─ Product   │                                  │
│                    ├─ Menu      │                                  │
│                    ├─ User      │                                  │
│                    ├─ Auth      │                                  │
│                    └─ AI        │                                  │
│                         │                                           │
│                    ┌────▼──────────┐                              │
│                    │ Prisma ORM    │                              │
│                    └────┬──────────┘                              │
│                         │                                           │
│                    ┌────▼──────────┐                              │
│                    │ SQLite DB     │                              │
│                    │ (dev.db)      │                              │
│                    └───────────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

External Services:
┌─────────────────────────────┐
│ Google Generative AI        │
│ (AI Service Integration)    │
└─────────────────────────────┘
```

---

## Backend Architecture

### Tech Stack
```
Language:      TypeScript 5.9.3
Framework:     NestJS 11.1.18
ORM:           Prisma 6.4.1
Database:      SQLite
Real-time:     Socket.io 4.8.3
Testing:       Jest 30.3.0
HTTP Client:   Axios 1.14.0
AI:            Google Generative AI 0.24.1
```

### Core Services

#### 1. AppController
**File:** `src/app.controller.ts`
- Central routing for all API endpoints
- Handles branch CRUD operations
- Handles order management
- Handles product operations
- Handles menu operations

#### 2. OrderService
**Responsibilities:**
- Order creation and management
- Order status tracking
- Order fulfillment
- Order payment processing

**Key Methods:**
```typescript
- createOrder()
- getOrder(id)
- updateOrderStatus(id, status)
- cancelOrder(id)
- getAllOrders()
```

#### 3. BranchService
**Responsibilities:**
- Branch management
- Location information
- Staff assignment
- Branch configuration

**Key Methods:**
```typescript
- getAllBranches()
- getBranchById(id)
- createBranch(data)
- updateBranch(id, data)
- deleteBranch(id)
```

#### 4. InventoryService
**Responsibilities:**
- Stock management
- Stock adjustments
- Inventory tracking
- Low stock alerts

**Key Methods:**
```typescript
- getInventory(branchId)
- updateStock(productId, quantity)
- trackUsage()
```

#### 5. ProductService
**Responsibilities:**
- Product management
- Product information
- Product pricing
- Product availability

**Key Methods:**
```typescript
- getAllProducts()
- getProduct(id)
- createProduct(data)
- updateProduct(id, data)
- deleteProduct(id)
```

#### 6. MenuService
**Responsibilities:**
- Menu structure
- Category management
- Menu item options
- Menu customization

**Key Methods:**
```typescript
- getMenu()
- createMenuItem()
- updateMenuItem()
- deleteMenuItem()
```

#### 7. UserService
**Responsibilities:**
- User management
- User profiles
- Role assignment
- User preferences

**Key Methods:**
```typescript
- getUser(id)
- createUser(data)
- updateUser(id, data)
- deleteUser(id)
```

#### 8. AuthService
**Responsibilities:**
- Authentication
- Authorization
- Token management
- Session management

#### 9. AIService
**Responsibilities:**
- Integration with Google Generative AI
- Natural language processing
- Recommendations
- Insights generation

#### 10. OrderGateway
**File:** `src/order.gateway.ts`
**Responsibilities:**
- WebSocket connection management
- Real-time order updates
- Live event broadcasting
- Bi-directional communication

**Events:**
```typescript
- order:create
- order:update
- order:status_change
- order:complete
```

### Database Schema (Prisma)
**File:** `prisma/schema.prisma`

**Key Models:**
- User
- Branch
- Product
- Menu
- MenuItem
- MenuOption
- Order
- OrderItem
- Inventory
- Address
- Category

**Migrations:**
```
migrations/
├── 20260408171649_branch_v2_location_managers/
├── 20260408173818_menu_v2_category_options/
├── 20260408231811_order_v2_upgrade/
└── ... (more migrations)
```

---

## Frontend Architecture

### Shared Technologies

#### Build & Development
```
Build Tool:     Vite 8.0.4
Type Checking:  TypeScript 6.0.2 / 5.9.3
Linting:        ESLint 9.39.4
Styling:        Tailwind CSS 3.4.19
CSS Processing: PostCSS 8.5.9
```

#### UI Components & Libraries
```
Framework:      React 19.2.4
DOM:            React DOM 19.2.4
Icons:          lucide-react 1.7.0
Animation:      framer-motion 12.38.0
Real-time:      socket.io-client 4.8.3
```

### Application Architectures

#### Admin HQ Dashboard

**Purpose:** Management interface for administrators

**Key Features:**
- Dashboard overview
- Branch management
- Staff management
- Menu management
- Order monitoring
- Analytics & reporting

**Pages:**
- Dashboard (overview)
- Branches (CRUD)
- Staff (user management)
- Products (inventory)
- Orders (management)
- Reports (analytics)
- Customers (user profiles)

**State Management:** React hooks (useState, useContext)

#### Branch POS System

**Purpose:** Point-of-sale system for branch operations

**Key Features:**
- Order creation
- Kitchen display system
- Queue monitoring
- Quality control
- Dispatch management

**Roles Supported:**
- Cashier (POS)
- Barista (KDS)
- Dispatcher
- QC (Quality Control)
- Queue Monitor

**Components:**
```
POSView          - Main point-of-sale interface
BaristaView      - Kitchen display system
DispatchView     - Order dispatch management
QCView          - Quality control checklist
QueueMonitorView - Queue status display
```

**Real-time Updates:** WebSocket via socket.io-client

#### Buyer LIFF App

**Purpose:** Customer-facing mobile app (LINE LIFF)

**Key Features:**
- Product catalog browsing
- Shopping cart management
- Order placement
- Payment processing
- Order tracking
- Order history
- Customer authentication (LINE Login)

**Integration:**
- LINE LIFF SDK (`@line/liff@2.28.0`)
- Payment gateway
- Real-time order updates

#### Translator Service

**Purpose:** Multi-language support and translation management

**Key Features:**
- Language translation
- Text localization
- UI string management
- Multi-language support

**Languages Supported:**
- Thai (ไทย) - Default
- English (ENG)
- Others (configurable)

---

## Data Model

### Core Entities

#### User
```typescript
{
  id: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER'
  branch?: Branch
  addresses?: Address[]
  orders?: Order[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Branch
```typescript
{
  id: string
  name: string
  location: string
  phone: string
  address: Address
  managers: User[]
  products: Product[]
  inventory: Inventory[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Product
```typescript
{
  id: string
  name: string
  description: string
  price: Decimal
  category: Category
  image?: string
  availability: boolean
  branches: Branch[]
  orders: OrderItem[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### Order
```typescript
{
  id: string
  user: User
  branch: Branch
  items: OrderItem[]
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  totalAmount: Decimal
  paymentMethod: 'CARD' | 'CASH' | 'ONLINE'
  paymentStatus: 'UNPAID' | 'PAID'
  notes: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### OrderItem
```typescript
{
  id: string
  order: Order
  product: Product
  quantity: number
  unitPrice: Decimal
  subtotal: Decimal
  customization?: JSON
  selectedOptions?: JSON
}
```

#### Menu
```typescript
{
  id: string
  name: string
  items: MenuItem[]
  category: Category
  active: boolean
}
```

#### MenuItem
```typescript
{
  id: string
  name: string
  description: string
  price: Decimal
  menu: Menu
  options: MenuOption[]
}
```

#### MenuOption
```typescript
{
  id: string
  name: string
  items: MenuItem[]
  values: string[]  // e.g., ["Small", "Medium", "Large"]
}
```

#### Inventory
```typescript
{
  id: string
  product: Product
  branch: Branch
  quantity: number
  reorderLevel: number
  lastRestocked: DateTime
}
```

---

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Branch Endpoints
```
GET    /branches                    - Get all branches
GET    /branches/:id                - Get branch by ID
POST   /branches                    - Create new branch
PATCH  /branches/:id                - Update branch
DELETE /branches/:id                - Delete branch
```

### Product Endpoints
```
GET    /products                    - Get all products
GET    /products/:id                - Get product by ID
POST   /products                    - Create new product
PATCH  /products/:id                - Update product
DELETE /products/:id                - Delete product
```

### Order Endpoints
```
GET    /orders                      - Get all orders
GET    /orders/:id                  - Get order by ID
POST   /orders                      - Create new order
PATCH  /orders/:id                  - Update order
DELETE /orders/:id                  - Cancel order
PATCH  /orders/:id/status           - Update order status
POST   /orders/:id/payment          - Process payment
```

### Menu Endpoints
```
GET    /menus                       - Get all menus
GET    /menus/:id                   - Get menu by ID
POST   /menus                       - Create new menu
PATCH  /menus/:id                   - Update menu
DELETE /menus/:id                   - Delete menu
```

### User Endpoints
```
GET    /users                       - Get all users
GET    /users/:id                   - Get user by ID
POST   /users                       - Create new user
PATCH  /users/:id                   - Update user
DELETE /users/:id                   - Delete user
```

### Auth Endpoints
```
POST   /auth/login                  - User login
POST   /auth/logout                 - User logout
POST   /auth/register               - User registration
POST   /auth/refresh                - Refresh token
```

### Inventory Endpoints
```
GET    /inventory                   - Get inventory
GET    /inventory/:branchId/:productId - Get specific item
PATCH  /inventory/:id               - Update stock
POST   /inventory/adjust            - Adjust stock levels
```

### Address Endpoints
```
GET    /addresses                   - Get all addresses
GET    /addresses/:id               - Get address by ID
POST   /addresses                   - Create new address
PATCH  /addresses/:id               - Update address
DELETE /addresses/:id               - Delete address
```

---

## Real-time Communication

### WebSocket Events (Socket.io)

#### Order Updates
```typescript
// Client listens
socket.on('order:created', (order) => { /* handle new order */ })
socket.on('order:updated', (order) => { /* handle order update */ })
socket.on('order:status_changed', (data) => { /* handle status change */ })
socket.on('order:completed', (order) => { /* handle completion */ })
socket.on('order:cancelled', (order) => { /* handle cancellation */ })

// Server broadcasts
io.emit('order:created', order)
io.emit('order:updated', order)
```

#### Real-time Status
```typescript
// Kitchen display system
socket.on('kitchen:order_ready', (order) => { /* notify dispatch */ })
socket.on('dispatch:order_picked', (order) => { /* notify customer */ })

// Queue monitoring
socket.on('queue:updated', (queueData) => { /* update queue display */ })
socket.on('queue:clear', () => { /* clear queue */ })
```

#### Inventory Updates
```typescript
socket.on('inventory:low_stock', (product) => { /* alert on low stock */ })
socket.on('inventory:updated', (inventory) => { /* update display */ })
```

---

## Deployment Guide

### Prerequisites
```
Node.js: 18+
npm: 9+
Database: SQLite or PostgreSQL
```

### Environment Setup

#### Backend (.env)
```
NODE_ENV=production
DATABASE_URL=file:./prod.db

# Or for PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/dbname

# API Configuration
API_PORT=3000
API_HOST=0.0.0.0

# AI Services
GOOGLE_AI_API_KEY=your_key_here

# LINE LIFF Configuration
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
```

#### Frontend Configuration
Update `.env` files in each frontend with:
```
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

### Build & Deploy

#### Backend Deployment
```bash
# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Seed database (if needed)
npx prisma db seed

# Build
npm run build

# Start production server
npm run start:prod
```

#### Frontend Deployment

**Admin HQ:**
```bash
npm install
npm run build
# Deploy dist/ to web server
```

**Branch POS:**
```bash
npm install
npm run build
# Deploy dist/ to web server or kiosk
```

**Buyer LIFF:**
```bash
npm install
npm run build
# Deploy to LINE LIFF endpoint
# URL: https://liff.line.me/YOUR_LIFF_ID
```

**Translator:**
```bash
npm install
npm run build
# Deploy as translation service
```

### Docker Deployment (Optional)

**Dockerfile for Backend:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Build and run:**
```bash
docker build -t 456-coffee-backend .
docker run -p 3000:3000 -e DATABASE_URL=... 456-coffee-backend
```

### Health Checks

#### Backend Health
```bash
curl http://localhost:3000/health
```

#### Database Health
```bash
npm run test:e2e
```

---

## Performance Optimization

### Backend
- Connection pooling (Prisma)
- Query optimization with indexes
- Caching strategies
- Rate limiting

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle size optimization

### Database
- Regular backups
- Query performance monitoring
- Index optimization

---

## Monitoring & Logging

### Recommended Services
- **Error Tracking:** Sentry
- **Performance:** New Relic or Datadog
- **Logs:** CloudWatch, ELK Stack, or Loggly
- **Uptime Monitoring:** UptimeRobot

### Key Metrics to Monitor
- API response time
- Error rate
- Database query performance
- WebSocket connection count
- Frontend bundle size
- User engagement

---

## Security Considerations

### Backend
- [ ] Input validation on all endpoints
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] HTTPS only in production
- [ ] Database encryption at rest
- [ ] Secure password hashing
- [ ] JWT token security

### Frontend
- [ ] Secure token storage
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Secure data transmission

### Database
- [ ] Regular backups
- [ ] Access control
- [ ] Audit logging
- [ ] Encryption

---

## Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check dependencies
npm install

# Check database
npx prisma db push

# Check environment
cat .env
```

#### Frontend won't build
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run lint
```

#### WebSocket not connecting
```bash
# Check backend running
curl http://localhost:3000

# Check firewall
sudo ufw allow 3000
```

---

## Support & Contact

For issues or questions, contact:
- **Technical Lead:** [Your contact info]
- **Documentation:** See other .md files in this repo
- **Issue Tracker:** Create GitHub issue

---

**Last Updated:** 9 เมษายน 2569
**Version:** 1.0

