-- Estado da encomenda na Batch (em espera até o admin a marcar como pronta para recolha)
ALTER TABLE "Order" ADD COLUMN "batchStatus" TEXT;
