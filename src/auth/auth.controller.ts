import { Controller, Body, Post, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UserSafe } from 'src/users/entities/user.schema';
import { Auth } from 'src/common/decorators/auth.decorator';
import { Cookies } from 'src/common/decorators/cookie.decorator';

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
