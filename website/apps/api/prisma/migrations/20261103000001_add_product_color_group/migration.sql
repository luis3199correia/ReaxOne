-- AlterTable
ALTER TABLE "Product" ADD COLUMN "color" TEXT,
ADD COLUMN "colorEn" TEXT,
ADD COLUMN "groupId" TEXT;

-- Pré-preenche os produtos existentes (feed Google Merchant: color + item_group_id)
UPDATE "Product" SET "groupId" = 'meias-reaxone-performance-casual', "color" = 'Branco/Preto', "colorEn" = 'White/Black' WHERE "slug" = 'meias-reaxone-performance-casual-branco-preto';
UPDATE "Product" SET "groupId" = 'meias-reaxone-performance-casual', "color" = 'Laranja',      "colorEn" = 'Orange'      WHERE "slug" = 'meias-reaxone-performance-casual-laranja';
UPDATE "Product" SET "groupId" = 'meias-reaxone-performance-casual', "color" = 'Vermelho',     "colorEn" = 'Red'         WHERE "slug" = 'meias-reaxone-performance-casual-vermelho';
UPDATE "Product" SET "groupId" = 'meias-reaxone-performance-casual', "color" = 'Verde',        "colorEn" = 'Green'       WHERE "slug" = 'meias-reaxone-performance-casual-verde';
UPDATE "Product" SET "groupId" = 'meias-reaxone-performance-casual', "color" = 'Rosa',         "colorEn" = 'Pink'        WHERE "slug" = 'meias-reaxone-performance-casual-rosa';
UPDATE "Product" SET "groupId" = 'bola-reacao', "color" = 'Rosa Choque', "colorEn" = 'Hot Pink' WHERE "slug" = 'bola-de-reacao-rosa-choque';
UPDATE "Product" SET "groupId" = 'bola-reacao', "color" = 'Branco',      "colorEn" = 'White'    WHERE "slug" = 'bola-reacao-branca';
UPDATE "Product" SET "groupId" = 'bola-reacao', "color" = 'Verde',       "colorEn" = 'Green'    WHERE "slug" = 'bola-reacao-verde';
