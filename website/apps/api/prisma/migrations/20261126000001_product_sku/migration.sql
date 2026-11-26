-- SKU do produto (catálogo da Batch). Gerado para os produtos existentes por
-- ordem de criação: RX-0001, RX-0002, …
ALTER TABLE "Product" ADD COLUMN "sku" TEXT;

UPDATE "Product" p
SET "sku" = 'RX-' || LPAD(o.rn::text, 4, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) AS rn
  FROM "Product"
) o
WHERE p.id = o.id;

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
