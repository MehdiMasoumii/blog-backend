import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(5)
  @MaxLength(48)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  description: string;

  @IsArray()
  @IsOptional()
  @IsString({
    each: true,
  })
  @Length(2, 16, {
    each: true,
  })
  tags: string[];
}
