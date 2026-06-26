-- CreateTable
CREATE TABLE "PaymentDevice" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomingPaymentEvent" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "deviceId" TEXT,
    "matchedOrderId" TEXT,
    "source" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "packageName" TEXT,
    "message" TEXT NOT NULL,
    "rawTimestamp" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "currency" TEXT DEFAULT 'THB',
    "bankCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomingPaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentDevice_username_key" ON "PaymentDevice"("username");

-- CreateIndex
CREATE INDEX "PaymentDevice_branchId_isActive_idx" ON "PaymentDevice"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "IncomingPaymentEvent_branchId_createdAt_idx" ON "IncomingPaymentEvent"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "IncomingPaymentEvent_branchId_status_idx" ON "IncomingPaymentEvent"("branchId", "status");

-- CreateIndex
CREATE INDEX "IncomingPaymentEvent_matchedOrderId_idx" ON "IncomingPaymentEvent"("matchedOrderId");

-- AddForeignKey
ALTER TABLE "PaymentDevice" ADD CONSTRAINT "PaymentDevice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingPaymentEvent" ADD CONSTRAINT "IncomingPaymentEvent_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingPaymentEvent" ADD CONSTRAINT "IncomingPaymentEvent_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "PaymentDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomingPaymentEvent" ADD CONSTRAINT "IncomingPaymentEvent_matchedOrderId_fkey" FOREIGN KEY ("matchedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
