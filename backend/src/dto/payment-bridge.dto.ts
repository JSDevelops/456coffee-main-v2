import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class PaymentDeviceLoginDto {
  @IsString()
  @Length(3, 80)
  username!: string;

  @IsString()
  @Length(6, 200)
  password!: string;
}

export class IncomingPaymentDto {
  @IsString()
  @Length(1, 80)
  sender!: string;

  @IsString()
  @Length(1, 4000)
  message!: string;

  @IsISO8601()
  timestamp!: string;

  @IsOptional()
  @IsIn(['sms', 'push_notification', 'gmail_push'])
  source?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  packageName?: string;
}

export class UpsertPaymentDeviceDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsString()
  @Length(3, 80)
  username!: string;

  @IsString()
  @Length(6, 200)
  password!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePaymentDeviceDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(3, 80)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(6, 200)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
