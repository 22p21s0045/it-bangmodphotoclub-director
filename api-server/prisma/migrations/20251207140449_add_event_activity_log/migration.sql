-- CreateEnum
CREATE TYPE "EventAction" AS ENUM ('USER_JOINED', 'USER_LEFT', 'PHOTO_UPLOADED', 'PHOTO_DELETED', 'STATUS_CHANGED', 'EVENT_UPDATED');

-- CreateTable
CREATE TABLE "EventActivityLog" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "EventAction" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventActivityLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventActivityLog" ADD CONSTRAINT "EventActivityLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventActivityLog" ADD CONSTRAINT "EventActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
