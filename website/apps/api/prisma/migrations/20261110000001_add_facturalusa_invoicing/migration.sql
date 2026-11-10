-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "facturalusaItemId" INTEGER;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoiceAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "invoiceError" TEXT,
ADD COLUMN     "invoiceId" INTEGER,
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "invoiceStatus" TEXT,
ADD COLUMN     "invoiceUrl" TEXT,
ADD COLUMN     "invoicedAt" TIMESTAMP(3);

