import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  /**
   * Envia o(s) ebook(s) comprados por email após confirmação de pagamento.
   *
   * @param to          Email do comprador
   * @param firstName   Nome próprio do comprador (para personalizar o email)
   * @param orderId     ID da encomenda (para referência)
   * @param ebooks      Lista de { title, filePath } — um por ebook comprado
   */
  async sendEbookDelivery(
    to: string,
    firstName: string,
    orderId: string,
    ebooks: Array<{ title: string; filePath: string }>,
  ): Promise<void> {
    const from = process.env.SMTP_USER || 'noreply@reaxone.com';

    // Construir attachments — apenas para ficheiros que existam no disco
    const attachments: nodemailer.SendMailOptions['attachments'] = [];
    for (const ebook of ebooks) {
      const absPath = path.isAbsolute(ebook.filePath)
        ? ebook.filePath
        : path.join(process.cwd(), ebook.filePath);

      if (!fs.existsSync(absPath)) {
        this.logger.warn(`Ficheiro ebook não encontrado: ${absPath}`);
        continue;
      }

      attachments.push({
        filename: `${ebook.title}.pdf`,
        path:     absPath,
        contentType: 'application/pdf',
      });
    }

    const ebookListHtml = ebooks
      .map((e) => `<li style="margin-bottom:4px;">${e.title}</li>`)
      .join('');

    await this.transporter.sendMail({
      from:    `"ReaxOne" <${from}>`,
      to,
      subject: `O teu ebook ReaxOne está aqui! 📚`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0F0F0F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #88C900; margin: 0; font-size: 22px;">O teu ebook está pronto!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
            <p style="font-size: 15px; line-height: 1.6;">Olá <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">
              O pagamento da tua encomenda <strong>#${orderId.slice(-8).toUpperCase()}</strong> foi confirmado.
              Encontras em anexo o(s) teu(s) ebook(s):
            </p>
            <ul style="font-size: 15px; line-height: 1.8; color: #333;">
              ${ebookListHtml}
            </ul>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Guarda o ficheiro PDF num lugar seguro — podes lê-lo no teu telemóvel, tablet ou computador.
            </p>
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Se tiveres alguma dúvida, responde a este email ou fala connosco pelo WhatsApp:<br>
              <a href="https://wa.me/351911084422" style="color: #E8322A;">+351 911 084 422</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
            <p style="font-size: 13px; color: #888; margin: 0;">
              Performance Primeiro. Sempre.<br>
              <strong>Equipa ReaxOne</strong>
            </p>
          </div>
        </div>
      `,
      attachments,
    });

    this.logger.log(`Ebook(s) enviado(s) para ${to} (encomenda ${orderId})`);
  }
}
