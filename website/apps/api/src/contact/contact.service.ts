import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface ContactDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   Number(process.env.SMTP_PORT)  || 587,
      secure: process.env.SMTP_SECURE === 'true', // false por padrão (587 + STARTTLS)
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendContactEmail(dto: ContactDto) {
    const to = process.env.CONTACT_EMAIL || 'contatos@reaxone.com';
    const from = process.env.SMTP_USER   || 'noreply@reaxone.com';

    // Email para a equipa ReaxOne
    await this.transporter.sendMail({
      from: `"ReaxOne Contacto" <${from}>`,
      to,
      replyTo: dto.email,
      subject: `[Contacto] ${dto.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0F0F0F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #88C900; margin: 0; font-size: 20px;">ReaxOne — Nova mensagem de contacto</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px; width: 100px;"><strong>Nome:</strong></td>
                <td style="padding: 8px 0; font-size: 14px;">${dto.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Email:</strong></td>
                <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${dto.email}" style="color: #E8322A;">${dto.email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-size: 14px;"><strong>Assunto:</strong></td>
                <td style="padding: 8px 0; font-size: 14px;">${dto.subject}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <p style="color: #666; font-size: 14px; margin: 0 0 8px;"><strong>Mensagem:</strong></p>
            <p style="font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${dto.message}</p>
          </div>
          <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 16px;">
            Enviado através do formulário em reaxone.pt
          </p>
        </div>
      `,
    });

    // Auto-resposta para o utilizador
    await this.transporter.sendMail({
      from: `"ReaxOne" <${from}>`,
      to: dto.email,
      subject: 'Recebemos a tua mensagem — ReaxOne',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0F0F0F; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #88C900; margin: 0; font-size: 20px;">Recebemos a tua mensagem!</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e5e5;">
            <p style="font-size: 15px; line-height: 1.6;">Olá <strong>${dto.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">
              Obrigado pelo teu contacto. A nossa equipa irá responder em breve.
            </p>
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Se preferires falar diretamente, estamos disponíveis pelo WhatsApp:<br>
              <a href="https://wa.me/351911084422" style="color: #E8322A;">+351 911 084 422</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;" />
            <p style="font-size: 13px; color: #888;">Performance Primeiro. Sempre.<br><strong>Equipa ReaxOne</strong></p>
          </div>
        </div>
      `,
    });
  }
}
