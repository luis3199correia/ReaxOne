import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { SettingsService } from '../settings/settings.service';

export interface ContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable()
export class ContactService {
  private resend = new Resend(process.env.RESEND_API_KEY || process.env.SMTP_PASS);

  constructor(private settingsService: SettingsService) {}

  private get from(): string {
    const addr = process.env.SMTP_FROM || process.env.CONTACT_EMAIL || 'noreply@reaxone.com';
    return `ReaxOne <${addr}>`;
  }

  async sendContactEmail(dto: ContactDto) {
    const settings     = await this.settingsService.getPublicSettings();
    const contactEmail = settings.contactEmail;
    const whatsappLine = settings.whatsappEnabled
      ? `Se preferires falar diretamente:<br>
              💬 WhatsApp: <a href="https://wa.me/${settings.whatsappNumber}" style="color:#E8322A;">+${settings.whatsappNumber}</a>`
      : '';

    // Email para a equipa
    await this.resend.emails.send({
      from:    this.from,
      to:      [contactEmail],
      replyTo: dto.email,
      subject: `[Contacto] ${dto.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:20px;">Nova mensagem de contacto</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#666;font-size:14px;width:100px;"><strong>Nome:</strong></td><td style="padding:8px 0;font-size:14px;">${dto.name}</td></tr>
              <tr><td style="padding:8px 0;color:#666;font-size:14px;"><strong>Email:</strong></td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${dto.email}" style="color:#E8322A;">${dto.email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;font-size:14px;"><strong>Assunto:</strong></td><td style="padding:8px 0;font-size:14px;">${dto.subject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;" />
            <p style="color:#666;font-size:14px;margin:0 0 8px;"><strong>Mensagem:</strong></p>
            <p style="font-size:15px;line-height:1.6;white-space:pre-wrap;margin:0;">${dto.message}</p>
          </div>
        </div>`,
    });

    // Auto-resposta ao utilizador
    await this.resend.emails.send({
      from:    this.from,
      to:      [dto.email],
      subject: 'Recebemos a tua mensagem — ReaxOne',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0F0F0F;padding:24px;border-radius:8px 8px 0 0;">
            <h1 style="color:#88C900;margin:0;font-size:20px;">Recebemos a tua mensagem!</h1>
          </div>
          <div style="background:#f9f9f9;padding:24px;border-radius:0 0 8px 8px;border:1px solid #e5e5e5;">
            <p style="font-size:15px;line-height:1.6;">Olá <strong>${dto.name}</strong>,</p>
            <p style="font-size:15px;line-height:1.6;">Obrigado pelo teu contacto. A nossa equipa irá responder em breve.</p>
            ${whatsappLine ? `<p style="font-size:14px;color:#666;line-height:1.6;">${whatsappLine}</p>` : ''}
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:16px 0;" />
            <p style="font-size:13px;color:#888;">Performance Primeiro. Sempre.<br><strong>Equipa ReaxOne</strong></p>
          </div>
        </div>`,
    });
  }
}
