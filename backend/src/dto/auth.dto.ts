import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/, { message: 'Invalid phone number format' })
  phone!: string;
}

export class VerifyOtpDto {
  @IsString()
  @Matches(/^[0-9+\-\s]{6,20}$/, { message: 'Invalid phone number format' })
  phone!: string;

  @IsString()
  @Length(4, 8)
  code!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class LineLoginDto {
  @IsOptional()
  @IsString()
  lineUid?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  pictureUrl?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class GoogleLoginDto {
  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  pictureUrl?: string;
}

export class AdminLoginDto {
  @IsString()
  @Length(1, 100)
  username!: string;

  @IsString()
  @Length(6, 200)
  password!: string;
}

export class StaffLoginDto {
  @IsString()
  branchId!: string;

  @IsString()
  @Length(4, 12)
  pin!: string;
}

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;
}

export class ChangeAdminPasswordDto {
  @IsString()
  @Length(1, 200)
  currentPassword!: string;

  @IsString()
  @Length(6, 200)
  newPassword!: string;
}
