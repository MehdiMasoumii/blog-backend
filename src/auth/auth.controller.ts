import {
  Controller,
  Body,
  Post,
  Res,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserSafe } from 'src/users/entities/user.schema';
import { Auth } from 'src/common/decorators/auth.decorator';
import { Cookies } from 'src/common/decorators/cookie.decorator';
import { ResetPassDto } from './dto/resetPass.dto';

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

  @Get('refresh')
  async refresh(
    @Cookies('refresh_token') refreshToken: string,
    @Res() res: Response,
  ) {
    await this.authService.refreshToken(refreshToken, res);
  }

  @Get('user')
  @Auth()
  getUser(@User() user: UserSafe) {
    return {
      statusCode: 200,
      message: 'you are authenticated!',
      user,
    };
  }

  @Get('verification')
  async sendVerification(
    @Query('email') userEmail: string | undefined,
    @Query('method') method: 'reset' | 'verify',
  ) {
    if (userEmail && method) {
      return await this.authService.sendVerification(userEmail, method);
    }
    throw new BadRequestException();
  }

  @Get('verify')
  async verifyEmail(
    @Query('email') userEmail: string | undefined,
    @Query('token') token: string | undefined,
  ) {
    if (userEmail && token) {
      return await this.authService.verifyEmail(userEmail, token);
    }
    throw new BadRequestException();
  }

  @Post('reset')
  async resetPassword(@Body() resetPassBody: ResetPassDto) {
    return await this.authService.resetPassword(resetPassBody);
  }

  @Get('logout')
  @Auth()
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.send({
      statusCode: 200,
      message: 'Logged out!',
    });
  }
}
