import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from './entities/user.schema';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(createUserDto: RegisterDto) {
    // Check if the email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email already in use',
        statusCode: HttpStatus.CONFLICT,
      });
    }

    // If email is unique, proceed to create the user
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(createUserDto.password, salt);

      return await this.userModel.create({
        ...createUserDto,
        password: hash,
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async findById(id: string) {
    try {
      return await this.userModel.findById(id);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async verify(email: string) {
    try {
      await this.userModel.findOneAndUpdate(
        {
          email,
        },
        {
          isVerifyed: true,
        },
      );
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async resetPassword(email: string, newPassword: string) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      await this.userModel.findOneAndUpdate(
        {
          email,
        },
        {
          password: hash,
        },
      );
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async toggleLike(postId: string, userId: string, action: 'remove' | 'add') {
    if (action === 'remove') {
      await this.userModel.findByIdAndUpdate(userId, {
        $pull: { likedPosts: postId },
      });
    } else {
      await this.userModel.findByIdAndUpdate(userId, {
        $addToSet: { likedPosts: postId },
      });
    }
  }
}
