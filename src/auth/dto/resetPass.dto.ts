import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPassDto {
  @IsEmail()
  email: string;

  @IsString()
  token: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  newPassword: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  newPasswordConfirmation: string;
}
