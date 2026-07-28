import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import { SettingsService, PublicSettings } from '../settings/settings.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor(private settingsService: SettingsService) {
    this.resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);
  }

  private get from(): string {
    const addr = process.env.SMTP_FROM || process.env.CONTACT_EMAIL || 'noreply@reaxone.com';
    return `ReaxOne <${addr}>`;
  }

  private contactBlock(settings: PublicSettings): string {
    return `
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="font-size:13px;color:#0369a1;margin:0 0 8px;font-weight:bold;">PRECISAS DE AJUDA?</p>
        <p style="font-size:13px;color:#333;margin:0;line-height:1.8;">
          📧 Email: <a href="mailto:${settings.contactEmail}" style="color:#E8322A;">${settings.contactEmail}</a>
          ${settings.whatsappEnabled ? `<br>💬 WhatsApp: <a href="https://wa.me/${settings.whatsappNumber}" style="color:#E8322A;">+${settings.whatsappNumber}</a>` : ''}
        </p>
      </div>`;
  }

  private footer(): string {
    return `
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;" />
      <p style="font-size:13px;color:#888;margin:0;">
        Performance Primeiro. Sempre.<br><strong>Equipa ReaxOne</strong>
      </p>`;
  }

  // ─── Ebook delivery ───────────────────────────────────────────────────────

  async sendEbookDelivery(
    to: string,
    firstName: string,
    orderId: string,
    ebooks: Array<{ title: string; filePath: string }>,
  ): Promise<void> {
    const shortId = orderId.slice(-8).toUpperCase();
    const settings = await this.settingsService.getPublicSettings();

    const attachments: Array<{ filename: string; content: Buffer }> = [];
    for (const ebook of ebooks) {
      const absPath = path.isAbsolute(ebook.filePath)
        ? ebook.filePath
        : path.join(process.cwd(), ebook.filePath);

      if (!fs.existsSync(absPath)) {
        this.logger.warn(`Ficheiro ebook não encontrado: ${absPath}`);
        continue;
      }
      attachments.push({ filename: `${ebook.title}.pdf`, content: fs.readFileSync(absPath) });
    }

    const ebookListHtml = ebooks.map((e) => `<li>${e.title}</li>`).join('');

    const { error } = await this.resend.emails.send({
      from:    this.from,
      to:      [to],
      subject: `O teu ebook ReaxOne está aqui! 📚`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:22px;">O teu ebook está pronto!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">
              O pagamento da tua encomenda <strong>#${shortId}</strong> foi confirmado.
              Encontras em anexo o(s) teu(s) ebook(s):
            </p>
            <ul style="font-size:15px;line-height:1.8;color:#333;">${ebookListHtml}</ul>
            <p style="font-size:14px;color:#555;line-height:1.6;">
              Guarda o ficheiro PDF num lugar seguro — podes lê-lo no teu telemóvel, tablet ou computador.
            </p>
            ${this.contactBlock(settings)}
            ${this.footer()}
          </div>
        </div>`,
      attachments,
    });

    if (error) throw new Error(JSON.stringify(error));
    this.logger.log(`Ebook(s) enviado(s) para ${to} (encomenda ${orderId})`);
  }

  // ─── Confirmação de encomenda ao cliente ──────────────────────────────────

  async sendOrderConfirmation(order: {
    id: string;
    firstName: string;
    email: string;
    totalAmount: number;
    paymentMethod: string;
    shippingMethod?: string | null;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    wantsInvoice?: boolean | null;
    nif?: string | null;
    companyName?: string | null;
    items: Array<{ name: string; quantity: number; price: number; size?: string | null }>;
  }): Promise<void> {
    const shortId    = order.id.slice(-8).toUpperCase();
    const settings   = await this.settingsService.getPublicSettings();
    const mbwayPhone = process.env.MBWAY_PHONE ?? '';

    const paymentInstructions = order.paymentMethod === 'MBWAY'
      ? `<div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
           <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:bold;">PAGAMENTO — MB WAY</p>
           <p style="font-size:14px;color:#333;margin:0;line-height:1.8;">
             Envia <strong>€${order.totalAmount.toFixed(2)}</strong> para <strong>${mbwayPhone}</strong><br>
             Referência: <strong>#${shortId}</strong>
           </p>
         </div>`
      : `<div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
           <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:bold;">PAGAMENTO — TRANSFERÊNCIA BANCÁRIA</p>
           <p style="font-size:14px;color:#333;margin:0;line-height:1.8;">
             IBAN: <strong>${settings.iban}</strong><br>
             ${settings.ibanHolder ? `Titular: <strong>${settings.ibanHolder}</strong><br>` : ''}
             Valor: <strong>€${order.totalAmount.toFixed(2)}</strong><br>
             Referência: <strong>#${shortId}</strong>
           </p>
         </div>`;

    const itemsHtml = order.items.map((i) =>
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.name}${i.size ? ` (${i.size})` : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`).join('');

    const { error } = await this.resend.emails.send({
      from:    this.from,
      to:      [order.email],
      subject: `Encomenda recebida #${shortId} — ReaxOne`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:22px;">Encomenda recebida!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${order.firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">
              Recebemos a tua encomenda <strong>#${shortId}</strong>.
              ${order.shippingMethod === 'digital' && order.totalAmount === 0
                ? settings.whatsappEnabled
                  ? `O teu ebook é <strong>gratuito</strong> — vamos enviá-lo diretamente via <strong>WhatsApp</strong> em breve. 📲<br>Número: <a href="https://wa.me/${settings.whatsappNumber}" style="color:#E8322A;">+${settings.whatsappNumber}</a>`
                  : `O teu ebook é <strong>gratuito</strong> — vamos enviá-lo diretamente para o teu email em breve. 📲`
                : order.shippingMethod === 'digital'
                ? 'A tua compra é um produto digital — <strong>não há portes de envio</strong>. Receberás o teu ebook no email assim que confirmarmos o pagamento. 📚'
                : 'Assim que confirmarmos o pagamento, tratamos do envio!'
              }
            </p>

            <h3 style="font-size:14px;color:#333;margin:20px 0 8px;">Produtos</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead><tr style="background:#efefef;">
                <th style="padding:6px 8px;text-align:left;">Produto</th>
                <th style="padding:6px 8px;text-align:center;">Qty</th>
                <th style="padding:6px 8px;text-align:right;">Total</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot><tr>
                <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold;">Total:</td>
                <td style="padding:10px 8px;text-align:right;font-weight:bold;color:#E8322A;">€${order.totalAmount.toFixed(2)}</td>
              </tr></tfoot>
            </table>

            ${order.shippingMethod !== 'digital' ? `
            <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:bold;">MORADA DE ENTREGA</p>
              <p style="font-size:14px;color:#333;margin:0;line-height:1.8;">
                ${order.street}<br>
                ${order.postalCode} ${order.city}<br>
                ${order.country}
                ${order.shippingMethod ? `<br><span style="color:#888;">Envio: ${order.shippingMethod}</span>` : ''}
              </p>
            </div>` : ''}

            ${order.wantsInvoice && order.nif ? `
            <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:bold;">DADOS DE FATURAÇÃO</p>
              <p style="font-size:14px;color:#333;margin:0;line-height:1.8;">
                ${order.companyName ? `${order.companyName}<br>` : ''}
                NIF: <strong>${order.nif}</strong>
              </p>
            </div>` : ''}

            ${paymentInstructions}
            ${this.contactBlock(settings)}
            ${this.footer()}
          </div>
        </div>`,
    });

    if (error) throw new Error(JSON.stringify(error));
    this.logger.log(`Confirmação de encomenda #${shortId} enviada para ${order.email}`);
  }

  // ─── Pagamento confirmado (com detalhes completos) ───────────────────────

  async sendPaymentConfirmed(order: {
    id: string;
    firstName: string;
    email: string;
    totalAmount: number;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    shippingMethod?: string | null;
    items: Array<{ name: string; quantity: number; price: number; size?: string | null }>;
  }): Promise<void> {
    const shortId  = order.id.slice(-8).toUpperCase();
    const settings = await this.settingsService.getPublicSettings();

    const itemsHtml = order.items.map((i) =>
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.name}${i.size ? ` (${i.size})` : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`).join('');

    const { error } = await this.resend.emails.send({
      from:    this.from,
      to:      [order.email],
      subject: `✅ Pagamento confirmado #${shortId} — ReaxOne`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:22px;">Pagamento confirmado!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${order.firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">
              O pagamento da tua encomenda <strong>#${shortId}</strong> foi confirmado. Estamos a preparar o teu pedido!
            </p>

            <h3 style="font-size:14px;color:#333;margin:20px 0 8px;">Produtos</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead><tr style="background:#efefef;">
                <th style="padding:6px 8px;text-align:left;">Produto</th>
                <th style="padding:6px 8px;text-align:center;">Qty</th>
                <th style="padding:6px 8px;text-align:right;">Total</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot><tr>
                <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold;">Total pago:</td>
                <td style="padding:10px 8px;text-align:right;font-weight:bold;color:#16A34A;">€${order.totalAmount.toFixed(2)}</td>
              </tr></tfoot>
            </table>

            <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:20px 0;">
              <p style="font-size:13px;color:#888;margin:0 0 8px;font-weight:bold;">MORADA DE ENTREGA</p>
              <p style="font-size:14px;color:#333;margin:0;line-height:1.8;">
                ${order.street}<br>
                ${order.postalCode} ${order.city}<br>
                ${order.country}
                ${order.shippingMethod ? `<br><span style="color:#888;">Envio: ${order.shippingMethod}</span>` : ''}
              </p>
            </div>

            ${this.contactBlock(settings)}
            ${this.footer()}
          </div>
        </div>`,
    });

    if (error) throw new Error(JSON.stringify(error));
    this.logger.log(`Email de pagamento confirmado #${shortId} enviado para ${order.email}`);
  }

  // ─── Notificação de nova encomenda ao admin ───────────────────────────────

  async sendNewOrderNotification(order: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    totalAmount: number;
    paymentMethod?: string;
    shippingMethod?: string | null;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    wantsInvoice?: boolean | null;
    nif?: string | null;
    companyName?: string | null;
    items: Array<{ name: string; quantity: number; price: number; size?: string | null }>;
  }): Promise<void> {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) return;

    const shortId      = order.id.slice(-8).toUpperCase();
    const paymentLabel = order.paymentMethod === 'MBWAY' ? 'MB Way' : 'Transferência Bancária';
    const frontendUrl  = process.env.FRONTEND_URL ?? 'https://reaxone.com';

    const itemsHtml = order.items.map((i) =>
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;">${i.name}${i.size ? ` (${i.size})` : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">€${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`).join('');

    const { error } = await this.resend.emails.send({
      from:    this.from,
      to:      [adminEmail],
      subject: `🛒 Nova encomenda #${shortId} — €${order.totalAmount.toFixed(2)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:20px 24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:20px;">Nova encomenda recebida!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td style="padding:6px 0;color:#888;font-size:13px;width:140px;">Referência</td><td style="padding:6px 0;font-weight:bold;">#${shortId}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Cliente</td><td style="padding:6px 0;">${order.firstName} ${order.lastName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Email</td><td style="padding:6px 0;"><a href="mailto:${order.email}" style="color:#E8322A;">${order.email}</a></td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Telefone</td><td style="padding:6px 0;">${order.phone}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Pagamento</td><td style="padding:6px 0;">${paymentLabel}</td></tr>
              ${order.shippingMethod ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">Envio</td><td style="padding:6px 0;">${order.shippingMethod}</td></tr>` : ''}
              <tr><td style="padding:6px 0;color:#888;font-size:13px;">Morada</td><td style="padding:6px 0;">${order.street}, ${order.postalCode} ${order.city}, ${order.country}</td></tr>
              ${order.wantsInvoice && order.nif ? `<tr><td style="padding:6px 0;color:#888;font-size:13px;">NIF</td><td style="padding:6px 0;">${order.companyName ? `${order.companyName} — ` : ''}${order.nif}</td></tr>` : ''}
            </table>
            <h3 style="font-size:14px;color:#333;margin:0 0 8px;">Itens</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead><tr style="background:#efefef;">
                <th style="padding:6px 8px;text-align:left;">Produto</th>
                <th style="padding:6px 8px;text-align:center;">Qty</th>
                <th style="padding:6px 8px;text-align:right;">Total</th>
              </tr></thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot><tr>
                <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:bold;">Total:</td>
                <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:16px;color:#E8322A;">€${order.totalAmount.toFixed(2)}</td>
              </tr></tfoot>
            </table>
            <p style="margin-top:24px;font-size:13px;color:#888;">
              <a href="${frontendUrl}/pt/admin/encomendas" style="color:#E8322A;">Ver no backoffice →</a>
            </p>
          </div>
        </div>`,
    });

    if (error) throw new Error(JSON.stringify(error));
    this.logger.log(`Notificação de nova encomenda #${shortId} enviada para ${adminEmail}`);
  }

  // ─── Notificação de mudança de estado ao cliente ──────────────────────────

  async sendOrderStatusUpdate(order: {
    id: string;
    firstName: string;
    email: string;
    status: string;
    totalAmount: number;
  }): Promise<void> {
    if (['PENDING', 'PAID'].includes(order.status)) return;

    const shortId  = order.id.slice(-8).toUpperCase();
    const settings = await this.settingsService.getPublicSettings();

    const STATUS_INFO: Record<string, { subject: string; title: string; color: string; body: string }> = {
      SHIPPED: {
        subject: `A tua encomenda #${shortId} foi enviada! 📦`,
        title:   'Encomenda enviada!',
        color:   '#7C3AED',
        body:    `A tua encomenda <strong>#${shortId}</strong> saiu do nosso armazém e está a caminho. Deverás recebê-la em breve.`,
      },
      DELIVERED: {
        subject: `Encomenda #${shortId} entregue — obrigado! 🎉`,
        title:   'Encomenda entregue!',
        color:   '#16A34A',
        body:    `A tua encomenda <strong>#${shortId}</strong> foi marcada como entregue. Esperamos que estejas a gostar dos teus produtos ReaxOne!`,
      },
      CANCELLED: {
        subject: `Encomenda #${shortId} cancelada`,
        title:   'Encomenda cancelada',
        color:   '#DC2626',
        body:    `A tua encomenda <strong>#${shortId}</strong> foi cancelada. Se não pediste o cancelamento ou tens alguma dúvida, fala connosco.`,
      },
    };

    const info = STATUS_INFO[order.status];
    if (!info) return;

    const { error } = await this.resend.emails.send({
      from:    this.from,
      to:      [order.email],
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
              <tr><td style="padding:6px 0;color:#888;width:140px;">Referência</td><td style="padding:6px 0;font-weight:bold;">#${shortId}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Total</td><td style="padding:6px 0;">€${order.totalAmount.toFixed(2)}</td></tr>
            </table>
            ${this.contactBlock(settings)}
            ${this.footer()}
          </div>
        </div>`,
    });

    if (error) throw new Error(JSON.stringify(error));
    this.logger.log(`Email de estado (${order.status}) para #${shortId} enviado a ${order.email}`);
  }

  // ─── Reset de password ────────────────────────────────────────────────────

  async sendPasswordReset(to: string, firstName: string, resetLink: string): Promise<void> {
    const settings = await this.settingsService.getPublicSettings();
    const { error } = await this.resend.emails.send({
      from:    this.from,
      to:      [to],
      subject: 'Recuperação de palavra-passe — ReaxOne',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:22px;">Recuperar palavra-passe</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${firstName}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">
              Recebemos um pedido para recuperar a palavra-passe da tua conta ReaxOne.
              Clica no botão abaixo para definir uma nova palavra-passe.
            </p>
            <p style="text-align:center;margin:32px 0;">
              <a href="${resetLink}" style="background:#E8322A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
                Definir nova palavra-passe
              </a>
            </p>
            <p style="font-size:13px;color:#888;line-height:1.6;">
              Este link é válido durante <strong>15 minutos</strong>.
              Se não pediste a recuperação, ignora este email.
            </p>
            ${this.contactBlock(settings)}
            ${this.footer()}
          </div>
        </div>`,
    });

    if (error) throw new Error(JSON.stringify(error));
    this.logger.log(`Email de reset de password enviado para ${to}`);
  }
}
