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
  private get fromAddress(): string {
    return process.env.SMTP_FROM || process.env.CONTACT_EMAIL || 'noreply@reaxone.com';
  }

  async sendEbookDelivery(
    to: string,
    firstName: string,
    orderId: string,
    ebooks: Array<{ title: string; filePath: string }>,
  ): Promise<void> {
    const from = this.fromAddress;

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

  async sendNewOrderNotification(order: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    totalAmount: number;
    paymentMethod?: string;
    shippingMethod?: string;
    items: Array<{ name: string; quantity: number; price: number; size?: string | null }>;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) return; // silencioso se não configurado

    const from    = this.fromAddress;
    const shortId = order.id.slice(-8).toUpperCase();

    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.name}${i.size ? ` <span style="color:#888;">(${i.size})</span>` : ''}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
          </tr>`,
      )
      .join('');

    const paymentLabel =
      order.paymentMethod === 'MBWAY' ? 'MB Way' : 'Transferência Bancária';

    await this.transporter.sendMail({
      from:    `"ReaxOne Loja" <${from}>`,
      to:      adminEmail,
      subject: `🛒 Nova encomenda #${shortId} — €${order.totalAmount.toFixed(2)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
          <div style="background: #0F0F0F; padding: 20px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #88C900; margin: 0; font-size: 20px;">Nova encomenda recebida!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr>
                <td style="padding:6px 0;color:#888;font-size:13px;width:140px;">Referência</td>
                <td style="padding:6px 0;font-weight:bold;font-size:15px;">#${shortId}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:13px;">Cliente</td>
                <td style="padding:6px 0;">${order.firstName} ${order.lastName}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:13px;">Email</td>
                <td style="padding:6px 0;"><a href="mailto:${order.email}" style="color:#E8322A;">${order.email}</a></td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:13px;">Telefone</td>
                <td style="padding:6px 0;">${order.phone}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;font-size:13px;">Pagamento</td>
                <td style="padding:6px 0;">${paymentLabel}</td>
              </tr>
              ${order.shippingMethod ? `
              <tr>
                <td style="padding:6px 0;color:#888;font-size:13px;">Envio</td>
                <td style="padding:6px 0;">${order.shippingMethod}</td>
              </tr>` : ''}
            </table>

            <h3 style="font-size:14px;color:#333;margin:0 0 8px;">Itens</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#efefef;">
                  <th style="padding:6px 8px;text-align:left;font-weight:600;">Produto</th>
                  <th style="padding:6px 8px;text-align:center;font-weight:600;">Qty</th>
                  <th style="padding:6px 8px;text-align:right;font-weight:600;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold;">Total da encomenda:</td>
                  <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:16px;color:#E8322A;">€${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <p style="margin-top:24px;font-size:13px;color:#888;">
              Ver no backoffice:
              <a href="${process.env.FRONTEND_URL ?? 'https://reaxone.com'}/pt/admin/encomendas" style="color:#E8322A;">
                Admin → Encomendas
              </a>
            </p>
          </div>
        </div>
      `,
    });

    this.logger.log(`Notificação de nova encomenda #${shortId} enviada para ${adminEmail}`);
  }

  async sendPasswordReset(to: string, firstName: string, resetLink: string): Promise<void> {
    const from = this.fromAddress;

    await this.transporter.sendMail({
      from:    `"ReaxOne" <${from}>`,
      to,
      subject: 'Recuperação de palavra-passe — ReaxOne',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0F0F0F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #88C900; margin: 0; font-size: 22px;">Recuperar palavra-passe</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
            <p style="font-size: 15px; line-height: 1.6;">Olá <strong>${firstName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">
              Recebemos um pedido para recuperar a palavra-passe da tua conta ReaxOne.
              Clica no botão abaixo para definir uma nova palavra-passe.
            </p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}"
                 style="background: #E8322A; color: white; padding: 14px 32px; border-radius: 8px;
                        text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
                Definir nova palavra-passe
              </a>
            </p>
            <p style="font-size: 13px; color: #888; line-height: 1.6;">
              Este link é válido durante <strong>15 minutos</strong>. Se não pediste a recuperação de
              palavra-passe, ignora este email — a tua conta continua segura.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 20px 0;" />
            <p style="font-size: 13px; color: #888; margin: 0;">
              Performance Primeiro. Sempre.<br>
              <strong>Equipa ReaxOne</strong>
            </p>
          </div>
        </div>
      `,
    });

    this.logger.log(`Email de reset de password enviado para ${to}`);
  }
}
