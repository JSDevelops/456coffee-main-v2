-- CreateTable
CREATE TABLE "BranchProductStatus" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchProductStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BranchProductStatus_branchId_status_idx" ON "BranchProductStatus"("branchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BranchProductStatus_branchId_productId_key" ON "BranchProductStatus"("branchId", "productId");

-- AddForeignKey
ALTER TABLE "BranchProductStatus" ADD CONSTRAINT "BranchProductStatus_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchProductStatus" ADD CONSTRAINT "BranchProductStatus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
