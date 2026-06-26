-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedBy" TEXT,
    "openingCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "closingCash" DOUBLE PRECISION,
    "expectedCash" DOUBLE PRECISION,
    "cashOrdersTotal" DOUBLE PRECISION,
    "variance" DOUBLE PRECISION,
    "ordersCount" INTEGER,
    "totalRevenue" DOUBLE PRECISION,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shift_branchId_status_idx" ON "Shift"("branchId", "status");

-- CreateIndex
CREATE INDEX "Shift_branchId_openedAt_idx" ON "Shift"("branchId", "openedAt");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
