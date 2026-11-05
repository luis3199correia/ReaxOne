-- Oferta automática configurável no backoffice
CREATE TABLE "GiftPromotion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "requiredUnits" INTEGER NOT NULL DEFAULT 2,
    "giftsPerGroup" INTEGER NOT NULL DEFAULT 1,
    "maxGiftsPerOrder" INTEGER NOT NULL DEFAULT 3,
    "messagePt" TEXT,
    "messageEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftPromotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GiftPromotionTrigger" (
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "GiftPromotionTrigger_pkey" PRIMARY KEY ("promotionId","productId")
);

CREATE TABLE "GiftPromotionGift" (
    "promotionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "GiftPromotionGift_pkey" PRIMARY KEY ("promotionId","productId")
);

ALTER TABLE "GiftPromotionTrigger" ADD CONSTRAINT "GiftPromotionTrigger_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "GiftPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftPromotionTrigger" ADD CONSTRAINT "GiftPromotionTrigger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftPromotionGift" ADD CONSTRAINT "GiftPromotionGift_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "GiftPromotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GiftPromotionGift" ADD CONSTRAINT "GiftPromotionGift_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Linhas de oferta nas encomendas e notas do cliente
ALTER TABLE "OrderItem" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "notes" TEXT;
