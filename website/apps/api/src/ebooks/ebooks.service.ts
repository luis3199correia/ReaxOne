import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { R2StorageService } from './r2-storage.service';
import { EbookFile, ebookFilesForOrder, watermarkText } from './ebook-files';
import { watermarkPdf } from './watermark';

const PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

/** EBOOK_WATERMARK=false desliga a marca "Licenciado a …" no rodapé dos PDFs. */
function watermarkEnabled(): boolean {
  return process.env.EBOOK_WATERMARK !== 'false';
}

/** Entrega dos ebooks pagos: PDFs do R2 em anexo no email ao cliente. */
@Injectable()
export class EbooksService {
  private readonly logger = new Logger(EbooksService.name);

  constructor(
    private prisma: PrismaService,
    private r2: R2StorageService,
    private mail: MailService,
  ) {}

  /** Chamado quando o pagamento é confirmado. Sem ebooks com ficheiro não faz nada. */
  async deliverForOrder(orderId: string): Promise<{ sent: number; ebooksSentAt: Date | null }> {
    const order = await this.prisma.order.findUnique({
      where:  { id: orderId },
      select: {
        id: true, email: true, firstName: true,
        items: { select: { productId: true, product: { select: { name: true, slug: true, ebookFile: true, ebookFileEn: true } } } },
      },
    });
    if (!order) throw new NotFoundException('Encomenda não encontrada');

    const files = ebookFilesForOrder(order.items);
    if (files.length === 0) return { sent: 0, ebooksSentAt: null };

    // Todos os PDFs ou nenhum: um email incompleto confundia o cliente
    const stamp = watermarkText(order.email, order.id);
    const attachments = await Promise.all(
      files.map(async (file) => ({ filename: file.filename, content: await this.prepareFile(file, stamp) })),
    );
    const titles = [...new Set(files.map((f) => f.title))];

    await this.mail.sendEbookDelivery(order.email, order.firstName, order.id, titles, attachments);
    const { ebooksSentAt } = await this.prisma.order.update({
      where:  { id: order.id },
      data:   { ebooksSentAt: new Date() },
      select: { ebooksSentAt: true },
    });
    return { sent: attachments.length, ebooksSentAt };
  }

  /** Backoffice: voltar a enviar (email perdido, falha no envio ou ficheiro corrigido). */
  async resend(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) throw new NotFoundException('Encomenda não encontrada');
    if (!PAID_STATUSES.includes(order.status)) {
      throw new BadRequestException('A encomenda ainda não está paga.');
    }
    const result = await this.deliverForOrder(orderId);
    if (result.sent === 0) throw new BadRequestException('Esta encomenda não tem ebooks com ficheiro no R2.');
    return result;
  }

  private async prepareFile(file: EbookFile, stamp: string): Promise<Buffer> {
    const original = await this.r2.getObject(file.key);
    if (!watermarkEnabled()) return original;
    try {
      return await watermarkPdf(original, stamp);
    } catch (err) {
      // PDF cifrado ou fora do normal: segue sem marca em vez de falhar a entrega
      this.logger.warn(`Marca não aplicada em ${file.key}; a enviar o original: ${(err as Error).message}`);
      return original;
    }
  }
}
