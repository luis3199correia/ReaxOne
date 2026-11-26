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
  Header,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ReorderFeaturedDto } from './product.dto';

function isAdmin(req: Request) {
  return (req.user as { role?: string } | null)?.role === 'ADMIN';
}

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // Público — lista produtos ativos (sem ebookFile)
  // ?all=true  → inclui inativos e dados completos (só admin; ignorado para os restantes)
  // ?featured=true → apenas produtos em destaque
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Req() req: Request,
    @Query('all') all?: string,
    @Query('featured') featured?: string,
  ) {
    const featuredFilter = featured === 'true' ? true : featured === 'false' ? false : undefined;
    if (all === 'true' && isAdmin(req)) {
      return this.productsService.findAll(false, featuredFilter);
    }
    return this.productsService.findAllPublic(featuredFilter);
  }

  // Admin — catálogo em CSV para importar na Batch (antes de :slug)
  @Get('export/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="reaxone-produtos-batch.csv"')
  exportBatch() {
    return this.productsService.exportBatchCsv();
  }

  // Público — produto por slug (sem ebookFile)
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlugPublic(slug);
  }

  // Admin apenas
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() body: CreateProductDto) {
    return this.productsService.create(body);
  }

  // Ordem dos destaques na página inicial (antes de :id)
  @Patch('featured/order')
  @UseGuards(JwtAuthGuard, RolesGuard)
  reorderFeatured(@Body() body: ReorderFeaturedDto) {
    return this.productsService.reorderFeatured(body.ids);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(@Param('id') id: string, @Body() body: UpdateProductDto) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
