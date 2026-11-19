-- Ebooks pagos entregues a partir do bucket R2 privado
ALTER TABLE "Product" ADD COLUMN "ebookFileEn" TEXT;
ALTER TABLE "Order" ADD COLUMN "digitalWaiverAt" TIMESTAMP(3), ADD COLUMN "ebooksSentAt" TIMESTAMP(3);
