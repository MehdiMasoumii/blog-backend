import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import {
  IsArray,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsString()
  @Length(5, 48)
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(256)
  description: string;

  @IsString()
  @IsOptional()
  content: string;

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
