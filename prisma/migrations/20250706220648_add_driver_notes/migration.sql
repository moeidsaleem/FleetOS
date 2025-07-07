-- CreateTable
CREATE TABLE "DriverNote" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverNote_driverId_idx" ON "DriverNote"("driverId");

-- AddForeignKey
ALTER TABLE "DriverNote" ADD CONSTRAINT "DriverNote_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
