import { Controller, Body, Post, Res, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserSchema } from 'src/users/entities/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = await this.authService.validateUser(loginDto);
    if (user) {
      // Generate and set JWT in cookies
      await this.authService.login(user, res);
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    await this.authService.register(registerDto, res);
  }

  @UseGuards(AuthGuard)
  @Get('user')
  getUser(@User() user: UserSchema) {
    return {
      statusCode: 200,
      message: 'you are authenticated!',
      user,
    };
  }
}
