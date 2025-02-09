/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(6)
  @MaxLength(24)
  fullname: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  @MaxLength(32)
  password: string;
}
