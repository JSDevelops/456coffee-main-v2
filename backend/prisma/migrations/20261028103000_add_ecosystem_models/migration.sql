-- CreateTable
CREATE TABLE "AcademyEnrollment" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lineId" TEXT,
    "courseTrack" TEXT NOT NULL DEFAULT 'COMPLETE_SOLUTION',
    "planStatus" TEXT,
    "preferredDate" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "batchNo" INTEGER,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantationBooking" (
    "id" TEXT NOT NULL,
    "farmCode" TEXT NOT NULL,
    "farmerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lineId" TEXT,
    "saplingCount" INTEGER NOT NULL DEFAULT 300,
    "landArea" TEXT,
    "subdistrict" TEXT,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'กาฬสินธุ์',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "gpsRaw" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BOOKED',
    "isPublicOnMap" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantationBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcosystemLocation" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "badge" TEXT,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'กาฬสินธุ์',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "hoursOrCapacity" TEXT,
    "phone" TEXT,
    "details" TEXT,
    "stats" TEXT,
    "actionText" TEXT,
    "actionHref" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcosystemLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademyEnrollment_phone_idx" ON "AcademyEnrollment"("phone");
CREATE INDEX "AcademyEnrollment_status_idx" ON "AcademyEnrollment"("status");
CREATE INDEX "AcademyEnrollment_courseTrack_idx" ON "AcademyEnrollment"("courseTrack");

-- CreateIndex
CREATE UNIQUE INDEX "PlantationBooking_farmCode_key" ON "PlantationBooking"("farmCode");
CREATE INDEX "PlantationBooking_phone_idx" ON "PlantationBooking"("phone");
CREATE INDEX "PlantationBooking_status_idx" ON "PlantationBooking"("status");
CREATE INDEX "PlantationBooking_farmCode_idx" ON "PlantationBooking"("farmCode");

-- CreateIndex
CREATE INDEX "EcosystemLocation_type_isActive_idx" ON "EcosystemLocation"("type", "isActive");
