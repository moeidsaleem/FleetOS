/*
  Warnings:

  - You are about to drop the `uber_sync_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "uber_sync_logs";

-- CreateTable
CREATE TABLE "UberSyncLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "driversProcessed" INTEGER NOT NULL DEFAULT 0,
    "driversCreated" INTEGER NOT NULL DEFAULT 0,
    "driversUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UberSyncLog_pkey" PRIMARY KEY ("id")
);
