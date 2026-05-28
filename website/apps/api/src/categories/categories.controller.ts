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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  // Público — GET /api/categories          → só visíveis
  // Admin   — GET /api/categories?all=true → todas
  @Get()
  findAll(@Query('all') all?: string) {
    return all === 'true'
      ? this.categoriesService.findAll()
      : this.categoriesService.findVisible();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: { name: string; slug: string }) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; visible?: boolean },
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
