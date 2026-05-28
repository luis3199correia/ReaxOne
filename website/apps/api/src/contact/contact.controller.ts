import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ContactService, ContactDto } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  @HttpCode(200)
  async send(@Body() body: ContactDto) {
    if (!body.name || !body.email || !body.message) {
      return { ok: false, error: 'Campos obrigatórios em falta.' };
    }

    try {
      await this.contactService.sendContactEmail(body);
      return { ok: true };
    } catch (err) {
      console.error('[ContactService] Erro ao enviar email:', err);
      // Não expõe o erro interno ao cliente
      return { ok: false, error: 'Erro ao enviar mensagem. Tenta novamente.' };
    }
  }
}
