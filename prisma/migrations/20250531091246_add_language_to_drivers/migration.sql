-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'ARABIC', 'HINDI', 'URDU', 'FRENCH', 'RUSSIAN', 'TAGALOG', 'SPANISH');

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'ENGLISH';
