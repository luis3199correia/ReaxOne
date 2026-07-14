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

  async sendOrderConfirmation(order: {
    id: string;
    firstName: string;
    email: string;
    totalAmount: number;
    paymentMethod: string;
    items: Array<{ name: string; quantity: number; price: number; size?: string | null }>;
  }): Promise<void> {
    const from    = this.fromAddress;
    const shortId = order.id.slice(-8).toUpperCase();

    const paymentLabel = order.paymentMethod === 'MBWAY' ? 'MB Way' : 'Transferência Bancária';
    const mbwayPhone   = process.env.MBWAY_PHONE ?? '';
    const iban         = process.env.BANK_IBAN   ?? '';

    const paymentInstructions = order.paymentMethod === 'MBWAY'
      ? `<p style="font-size:14px;line-height:1.6;color:#333;">
           Para concluir o pagamento via <strong>MB Way</strong>, envia <strong>€${order.totalAmount.toFixed(2)}</strong>
           para o número <strong>${mbwayPhone}</strong> com a referência <strong>#${shortId}</strong>.
         </p>`
      : `<p style="font-size:14px;line-height:1.6;color:#333;">
           Para concluir o pagamento por <strong>Transferência Bancária</strong>, transfere
           <strong>€${order.totalAmount.toFixed(2)}</strong> para o IBAN:<br>
           <strong>${iban}</strong><br>
           Indica a referência <strong>#${shortId}</strong> na descrição.
         </p>`;

    const itemsHtml = order.items
      .map((i) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.name}${i.size ? ` (${i.size})` : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`)
      .join('');

    await this.transporter.sendMail({
      from:    `"ReaxOne" <${from}>`,
      to:      order.email,
      subject: `Encomenda recebida #${shortId} — ReaxOne`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:22px;">Encomenda recebida!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${order.firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">
              Recebemos a tua encomenda <strong>#${shortId}</strong>. Assim que confirmarmos o pagamento,
              tratamos do envio!
            </p>

            <h3 style="font-size:14px;color:#333;margin:20px 0 8px;">Resumo da encomenda</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#efefef;">
                  <th style="padding:6px 8px;text-align:left;">Produto</th>
                  <th style="padding:6px 8px;text-align:center;">Qty</th>
                  <th style="padding:6px 8px;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold;">Total:</td>
                  <td style="padding:10px 8px;text-align:right;font-weight:bold;color:#E8322A;">€${order.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:bold;">INSTRUÇÕES DE PAGAMENTO (${paymentLabel})</p>
              ${paymentInstructions}
            </div>

            <p style="font-size:13px;color:#888;line-height:1.6;">
              Dúvidas? Fala connosco pelo WhatsApp:
              <a href="https://wa.me/351911084422" style="color:#E8322A;">+351 911 084 422</a>
            </p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
            <p style="font-size:13px;color:#888;margin:0;">Performance Primeiro. Sempre.<br><strong>Equipa ReaxOne</strong></p>
          </div>
        </div>
      `,
    });

    this.logger.log(`Confirmação de encomenda #${shortId} enviada para ${order.email}`);
  }

  async sendOrderStatusUpdate(order: {
    id: string;
    firstName: string;
    email: string;
    status: string;
    totalAmount: number;
  }): Promise<void> {
    // Não enviar para PENDING (estado inicial) nem PAID (já tratado pela confirmação de pagamento)
    if (['PENDING', 'PAID'].includes(order.status)) return;

    const from    = this.fromAddress;
    const shortId = order.id.slice(-8).toUpperCase();
    const whatsapp = process.env.WHATSAPP_NUMBER ?? '351911084422';
    const contactEmail = process.env.CONTACT_EMAIL ?? 'contatos@reaxone.com';

    const STATUS_INFO: Record<string, { subject: string; title: string; color: string; body: string }> = {
      SHIPPED: {
        subject: `A tua encomenda #${shortId} foi enviada! 📦`,
        title:   'Encomenda enviada!',
        color:   '#7C3AED',
        body:    `A tua encomenda <strong>#${shortId}</strong> saiu do nosso armazém e está a caminho. Deverás recebê-la em breve. Assim que tivermos informação de rastreio, enviamos-te os detalhes.`,
      },
      DELIVERED: {
        subject: `Encomenda #${shortId} entregue — obrigado! 🎉`,
        title:   'Encomenda entregue!',
        color:   '#16A34A',
        body:    `A tua encomenda <strong>#${shortId}</strong> foi marcada como entregue. Esperamos que estejas a gostar dos teus produtos ReaxOne! Se ainda não recebeste ou algo não está bem, entra em contacto connosco.`,
      },
      CANCELLED: {
        subject: `Encomenda #${shortId} cancelada`,
        title:   'Encomenda cancelada',
        color:   '#DC2626',
        body:    `A tua encomenda <strong>#${shortId}</strong> foi cancelada. Se não pediste o cancelamento ou tens alguma dúvida, fala connosco — resolvemos rapidamente.`,
      },
    };

    const info = STATUS_INFO[order.status];
    if (!info) return; // estado desconhecido — não enviar

    const contactBlock = `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="font-size:13px;color:#0369a1;margin:0 0 8px;font-weight:bold;">PRECISAS DE AJUDA?</p>
        <p style="font-size:13px;color:#333;margin:0;line-height:1.8;">
          📧 Email: <a href="mailto:${contactEmail}" style="color:#E8322A;">${contactEmail}</a><br>
          💬 WhatsApp: <a href="https://wa.me/${whatsapp}" style="color:#E8322A;">+${whatsapp.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')}</a>
        </p>
      </div>`;

    await this.transporter.sendMail({
      from:    `"ReaxOne" <${from}>`,
      to:      order.email,
      subject: info.subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:${info.color};margin:0;font-size:22px;">${info.title}</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${order.firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">${info.body}</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
              <tr>
                <td style="padding:6px 0;color:#888;width:140px;">Referência</td>
                <td style="padding:6px 0;font-weight:bold;">#${shortId}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;">Total</td>
                <td style="padding:6px 0;">€${order.totalAmount.toFixed(2)}</td>
              </tr>
            </table>
            ${contactBlock}
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
            <p style="font-size:13px;color:#888;margin:0;">Performance Primeiro. Sempre.<br><strong>Equipa ReaxOne</strong></p>
          </div>
        </div>
      `,
    });

    this.logger.log(`Email de estado (${order.status}) para encomenda #${shortId} enviado a ${order.email}`);
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
