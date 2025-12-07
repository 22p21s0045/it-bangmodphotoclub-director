-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('RAW', 'EDITED');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "type" "PhotoType" NOT NULL DEFAULT 'RAW';
