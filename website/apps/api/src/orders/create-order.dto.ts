import { Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsString, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { MAX_QUANTITY_PER_ITEM, NOTES_MAX_LENGTH, PAYMENT_METHODS } from './orders.service';

const MAX_LINES = 50;
const MAX_GIFTS = 20;
const ID_MAX = 64;
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const PHONE_MAX = 30;
const ADDRESS_MAX = 200;
const CITY_MAX = 100;
const POSTAL_CODE_MAX = 20;
const COUNTRY_MAX = 56;
const NIF_MAX = 20;
const COMPANY_MAX = 200;
const CODE_MAX = 64;
const LOCALE_MAX = 10;
const SIZE_MAX = 20;
const PRODUCT_NAME_MAX = 300;

/**
 * Corpo de POST /orders. Só valida forma e tamanhos: preços, portes, descontos,
 * ofertas e stock são sempre recalculados/validados no OrdersService.
 * O ValidationPipe global (whitelist + forbidNonWhitelisted) rejeita campos a mais.
 */
export class CreateOrderItemDto {
  @IsString() @IsNotEmpty() @MaxLength(ID_MAX)
  productId: string;

  @IsInt() @Min(1) @Max(MAX_QUANTITY_PER_ITEM)
  quantity: number;

  @IsOptional() @IsString() @MaxLength(SIZE_MAX)
  size?: string;

  // Enviados pelo checkout, mas ignorados: o servidor usa o nome e o preço da BD
  @IsOptional() @IsString() @MaxLength(PRODUCT_NAME_MAX)
  name?: string;

  @IsOptional() @IsNumber()
  price?: number;
}

export class CreateOrderGiftDto {
  @IsString() @IsNotEmpty() @MaxLength(ID_MAX)
  productId: string;

  @IsInt() @Min(1) @Max(MAX_QUANTITY_PER_ITEM)
  quantity: number;
}

export class CreateOrderDto {
  @IsString() @IsNotEmpty() @MaxLength(NAME_MAX)
  firstName: string;

  @IsString() @IsNotEmpty() @MaxLength(NAME_MAX)
  lastName: string;

  @IsEmail() @MaxLength(EMAIL_MAX)
  email: string;

  @IsString() @IsNotEmpty() @MaxLength(PHONE_MAX)
  phone: string;

  @IsString() @IsNotEmpty() @MaxLength(ADDRESS_MAX)
  street: string;

  @IsString() @IsNotEmpty() @MaxLength(CITY_MAX)
  city: string;

  @IsString() @IsNotEmpty() @MaxLength(POSTAL_CODE_MAX)
  postalCode: string;

  @IsOptional() @IsString() @MaxLength(COUNTRY_MAX)
  country?: string;

  @IsOptional() @IsBoolean()
  wantsInvoice?: boolean;

  @IsOptional() @IsString() @MaxLength(NIF_MAX)
  nif?: string;

  @IsOptional() @IsString() @MaxLength(COMPANY_MAX)
  companyName?: string;

  @IsIn(PAYMENT_METHODS)
  paymentMethod: (typeof PAYMENT_METHODS)[number];

  @IsOptional() @IsString() @MaxLength(PHONE_MAX)
  mbwayPhone?: string;

  @IsOptional() @IsString() @MaxLength(LOCALE_MAX)
  locale?: string;

  @IsOptional() @IsString() @MaxLength(CODE_MAX)
  shippingMethod?: string;

  @IsOptional() @IsString() @MaxLength(CODE_MAX)
  discountCode?: string;

  @IsOptional() @IsString() @MaxLength(NOTES_MAX_LENGTH)
  notes?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(MAX_GIFTS)
  @ValidateNested({ each: true }) @Type(() => CreateOrderGiftDto)
  gifts?: CreateOrderGiftDto[];

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(MAX_LINES)
  @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
