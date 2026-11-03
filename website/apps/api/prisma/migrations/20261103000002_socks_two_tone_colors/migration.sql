-- Meias: cor com as duas cores, como no título (feed Google Merchant)
UPDATE "Product" SET "color" = 'Laranja/Azul',    "colorEn" = 'Orange/Blue'  WHERE "slug" = 'meias-reaxone-performance-casual-laranja';
UPDATE "Product" SET "color" = 'Vermelho/Branco', "colorEn" = 'Red/White'    WHERE "slug" = 'meias-reaxone-performance-casual-vermelho';
UPDATE "Product" SET "color" = 'Verde/Preto',     "colorEn" = 'Green/Black'  WHERE "slug" = 'meias-reaxone-performance-casual-verde';
UPDATE "Product" SET "color" = 'Rosa/Branco',     "colorEn" = 'Pink/White'   WHERE "slug" = 'meias-reaxone-performance-casual-rosa';
UPDATE "Product" SET "color" = 'Branco/Preto',    "colorEn" = 'White/Black'  WHERE "slug" = 'meias-reaxone-performance-casual-branco-preto';

-- Meias Verde & Preto: descrição EN com o mesmo modelo das outras cores
-- (só substitui o texto antigo, para não apagar edições feitas no backoffice)
UPDATE "Product" SET "descriptionEn" = 'Seamless Green & Black socks with an elastic band across the instep for a perfect fit. One size, for training, play and everyday wear.

The band keeps the sock in place and gives a perfect heel fit, without losing comfort. The seamless construction adds comfort and freedom of movement.

Made for those always on the move: versatile, comfortable and with an identity of their own.

Details: one size · 82% cotton, 15% polyamide, 3% elastane
Care: machine wash at 30 °C · tumble dry low · do not bleach

Train. Play. Move. Live. React First.'
WHERE "slug" = 'meias-reaxone-performance-casual-verde' AND "descriptionEn" LIKE 'Built to keep up with your pace.%';
