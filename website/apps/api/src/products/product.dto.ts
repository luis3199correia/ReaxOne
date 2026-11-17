import { PartialType } from '@nestjs/mapped-types';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

const DOWNLOAD_URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true };

// Campos aceites na criação/edição de produtos (backoffice).
// O ValidationPipe global (whitelist + forbidNonWhitelisted) rejeita o resto.
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  nameEn?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  colorEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupId?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  ebookFile?: string; // caminho para o PDF (apenas para ebooks)

  // Links públicos de download dos ebooks gratuitos (null limpa o valor)
  @IsOptional()
  @IsUrl(DOWNLOAD_URL_OPTIONS)
  @MaxLength(500)
  downloadUrl?: string | null;

  @IsOptional()
  @IsUrl(DOWNLOAD_URL_OPTIONS)
  @MaxLength(500)
  downloadUrlEn?: string | null;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
