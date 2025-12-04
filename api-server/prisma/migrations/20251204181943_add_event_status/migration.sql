-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('UPCOMING', 'PENDING_RAW', 'PENDING_EDIT', 'COMPLETED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'UPCOMING';
