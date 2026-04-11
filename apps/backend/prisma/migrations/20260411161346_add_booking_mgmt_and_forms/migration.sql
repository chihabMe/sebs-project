/*
  Warnings:

  - A unique constraint covering the columns `[invitationToken]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_eventId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "invitationToken" TEXT;

-- CreateTable
CREATE TABLE "EventFormQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "EventFormQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAnswer" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "BookingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_invitationToken_key" ON "Event"("invitationToken");

-- AddForeignKey
ALTER TABLE "EventFormQuestion" ADD CONSTRAINT "EventFormQuestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAnswer" ADD CONSTRAINT "BookingAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "EventFormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAnswer" ADD CONSTRAINT "BookingAnswer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
