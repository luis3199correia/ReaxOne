-- Descrição do método de envio escolhido (service_name da Batch, ex.: ponto de recolha)
ALTER TABLE "Order" ADD COLUMN "shippingMethodName" TEXT;
