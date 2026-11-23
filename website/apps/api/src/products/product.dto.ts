import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  ArrayUnique,
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
  ValidateBy,
} from 'class-validator';
import { isValidEbookKey } from '../ebooks/ebook-files';

const MAX_FEATURED_REORDER = 200;

const DOWNLOAD_URL_OPTIONS ={ protocols: ['http', 'https'], require_protocol: true };

/** Chave do PDF no bucket R2 privado, ex: ebooks/padel-pt.pdf */
function IsEbookKey() {
  return ValidateBy({
    name: 'isEbookKey',
    validator: {
      validate: (value: unknown) => typeof value === 'string' && isValidEbookKey(value),
      defaultMessage: () => 'Ficheiro do ebook inválido: indica o nome no bucket, ex: ebooks/nome.pdf',
    },
  });
}

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

  // Ebooks pagos: PDF no bucket R2 privado, enviado em anexo após o pagamento (null limpa)
  @IsOptional()
  @IsEbookKey()
  ebookFile?: string | null;

  @IsOptional()
  @IsEbookKey()
  ebookFileEn?: string | null;

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

/** Nova ordem dos produtos em destaque: ids pela ordem pretendida. */
export class ReorderFeaturedDto {
  @IsArray()
  @ArrayMaxSize(MAX_FEATURED_REORDER)
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[];
}
