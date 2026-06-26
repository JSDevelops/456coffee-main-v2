import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  optionsPrice?: number;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  customization?: any;

  @IsOptional()
  selectedOptions?: any;
}

export class CreateOrderDto {
  @IsString()
  branchId!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  customerUid?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsIn(['PICKUP', 'DELIVERY'])
  fulfillmentType?: 'PICKUP' | 'DELIVERY';

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsIn(['CASH', 'QR', 'TRANSFER', 'ONLINE'])
  paymentMethod?: string;

  @IsOptional()
  @IsIn(['STORE', 'LINE', 'GRAB', 'FOODPANDA'])
  platform?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  metadata?: { riderName?: string; riderPhone?: string; qcNote?: string };
}

export class UpdatePaymentDto {
  @IsIn(['UNPAID', 'PAID', 'FAILED', 'REFUNDED'])
  status!: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;
}
