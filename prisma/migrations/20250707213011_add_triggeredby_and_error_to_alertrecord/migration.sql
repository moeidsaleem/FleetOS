-- CreateEnum
CREATE TYPE "TriggeredBy" AS ENUM ('MANUAL', 'AUTO');

-- AlterTable
ALTER TABLE "alert_records" ADD COLUMN     "error" TEXT,
ADD COLUMN     "triggeredBy" "TriggeredBy" NOT NULL DEFAULT 'MANUAL';
