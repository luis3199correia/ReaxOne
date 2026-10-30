import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // Público — GET /api/categories          → só visíveis
  // Admin   — GET /api/categories?all=true → todas (ignorado para não-admins)
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Req() req: Request, @Query('all') all?: string) {
    const isAdmin = (req.user as { role?: string } | null)?.role === 'ADMIN';
    return all === 'true' && isAdmin
      ? this.categoriesService.findAll()
      : this.categoriesService.findVisible();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: { name: string; nameEn?: string; slug: string }) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; nameEn?: string | null; slug?: string; visible?: boolean },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
