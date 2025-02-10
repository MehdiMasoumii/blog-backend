import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(4)
  @MaxLength(36)
  fullname: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  password: string;
}
