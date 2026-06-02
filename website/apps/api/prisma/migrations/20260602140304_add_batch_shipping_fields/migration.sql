-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "batchOrderNumber" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingMethod" TEXT;
