import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SettingsService, PublicSettings } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // Público — usado pelo storefront (WhatsApp, JSON-LD, checkout)
  @Get('public')
  getPublic() {
    return this.settingsService.getPublicSettings();
  }

  // Admin — mesmos dados, para pré-preencher o formulário de configurações
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAll() {
    return this.settingsService.getPublicSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Body() body: Partial<PublicSettings>) {
    return this.settingsService.updateSettings(body);
  }
}
