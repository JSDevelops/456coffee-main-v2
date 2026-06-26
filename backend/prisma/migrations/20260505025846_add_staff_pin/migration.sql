-- AlterTable
ALTER TABLE "BranchManager" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pin" TEXT;

-- CreateIndex
CREATE INDEX "BranchManager_branchId_isActive_idx" ON "BranchManager"("branchId", "isActive");
