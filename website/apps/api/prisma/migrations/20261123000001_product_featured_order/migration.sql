-- Ordem dos produtos em destaque na página inicial (menor = primeiro)
ALTER TABLE "Product" ADD COLUMN "featuredOrder" INTEGER NOT NULL DEFAULT 0;

-- Mantém a ordem atual (mais recentes primeiro) para os destaques existentes
UPDATE "Product" p
SET "featuredOrder" = o.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC) - 1 AS rn
  FROM "Product"
  WHERE featured = true
) o
WHERE p.id = o.id;
