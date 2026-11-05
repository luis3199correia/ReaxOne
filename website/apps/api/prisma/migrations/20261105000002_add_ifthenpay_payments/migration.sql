-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MULTIBANCO';
ALTER TYPE "PaymentMethod" ADD VALUE 'CARD';
ALTER TYPE "PaymentMethod" ADD VALUE 'APPLE_PAY';
ALTER TYPE "PaymentMethod" ADD VALUE 'GOOGLE_PAY';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "providerRef" TEXT,
ADD COLUMN "requestId" TEXT,
ADD COLUMN "entity" TEXT,
ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
