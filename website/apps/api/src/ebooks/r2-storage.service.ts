import { Injectable } from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Os PDFs seguem em anexo: acima disto há servidores de email que recusam a mensagem
const MAX_EBOOK_BYTES = 10 * 1024 * 1024;

/**
 * Leitura dos PDFs dos ebooks pagos no bucket Cloudflare R2 privado (API compatível com S3).
 * Credenciais só de leitura, nas variáveis R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.
 */
@Injectable()
export class R2StorageService {
  private readonly bucket = process.env.R2_BUCKET ?? '';
  private readonly client: S3Client | null;

  constructor() {
    // R2_ENDPOINT tal como o Cloudflare o mostra (inclui buckets com jurisdição, ex: ….eu.r2.cloudflarestorage.com);
    // sem ele, monta-se o endpoint normal a partir de R2_ACCOUNT_ID
    const accountId = process.env.R2_ACCOUNT_ID;
    const endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.client = endpoint && accessKeyId && secretAccessKey && this.bucket
      ? new S3Client({
          region: 'auto',
          endpoint,
          credentials: { accessKeyId, secretAccessKey },
        })
      : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async getObject(key: string): Promise<Buffer> {
    if (!this.client) {
      throw new Error('R2 não configurado (R2_ENDPOINT ou R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)');
    }
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!res.Body) throw new Error(`R2: objeto vazio (${key})`);
    if (res.ContentLength && res.ContentLength > MAX_EBOOK_BYTES) {
      throw new Error(`R2: ${key} tem ${res.ContentLength} bytes, acima do limite para anexo`);
    }
    return Buffer.from(await res.Body.transformToByteArray());
  }
}
