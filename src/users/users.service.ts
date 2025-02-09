import { ConflictException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User } from './entities/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto) {
    // Check if the email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) throw new ConflictException('Email already in use');

    // If email is unique, proceed to create the user
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(createUserDto.password, salt);
    return await this.userModel.create({
      ...createUserDto,
      password: hash,
    });
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  // findAll() {
  //   return `This action returns all users`;
  // }

  async findById(id: string) {
    return await this.userModel.findById(id);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    return await this.userModel.findByIdAndDelete(id);
  }
}
