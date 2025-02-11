import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.schema';
import { JWTPayload } from './entities/jwt.interface';
import { Response } from 'express';
import { RegisterDto } from './dto/register.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis.service';
import { ResetPassDto } from './dto/resetPass.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  // validates incoming credentials, if user exists and password matchs,
  // returns user, otherwise it will throw an http unauthorized exception
  async validateUser(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (user) {
      const isPasswordMatch = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (isPasswordMatch) {
        return user;
      }
    }
    throw new UnauthorizedException({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Invalid credentials',
    });
  }

  // generates an access token with a given user object and returns it
  async generateAccessToken(user: User): Promise<string> {
    const payload: JWTPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerifyed,
    };

    try {
      return await this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  // generates a refresh token with a given user object and returns it
  async generateRefreshToken(user: User): Promise<string> {
    const payload: Partial<JWTPayload> = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };
    try {
      return await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      });
    } catch {
      throw new InternalServerErrorException();
    }
  }

  // uses a valid refresh token and generates a new access token and returns it
  // if not valid, throw a user not found error!
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded: JWTPayload = await this.jwtService.verifyAsync(refreshToken); // Decoding the refresh token
    const user = await this.userService.findById(decoded.sub);
    if (!user) {
      throw new Error('User not found');
    }
    return this.generateAccessToken(user); // Generate a new access token for the user
  }

  // login functionality
  async login(
    user: User,
    res: Response,
    withResponse: boolean = true, // if passed false, this function won't send any responses, and you should handle response
  ): Promise<any> {
    const refreshToken = await this.generateRefreshToken(user);
    const accessToken = await this.generateAccessToken(user);
    // Set the access token and refresh token in HttpOnly cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use `secure: true` in production
      sameSite: 'strict', // Can be 'Lax', 'Strict' or 'None' (for cross-site cookies)
      maxAge: 60 * 60 * 1000, // 1 hour expiration for access token
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration for refresh token
    });
    if (withResponse)
      return res.status(200).send({
        statusCode: 200,
        message: 'Logined successfully',
      });
  }

  // register functionality
  async register(registerDto: RegisterDto, res: Response) {
    const user = await this.userService.create(registerDto);
    await this.login(user, res, false);
    res.status(HttpStatus.CREATED).send({
      statusCode: HttpStatus.CREATED,
      message: 'registered!',
      user: {
        fullname: user.fullname,
        email: user.email,
      },
    });
  }

  async refreshToken(token: string, res: Response) {
    if (!token) throw new UnauthorizedException();

    const access_token = await this.refreshAccessToken(token);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use `secure: true` in production
      sameSite: 'strict', // Can be 'Lax', 'Strict' or 'None' (for cross-site cookies)
      maxAge: 60 * 60 * 1000, // 1 hour expiration for access token
    });

    return res.status(200).send({
      statusCode: 200,
      message: 'Token refreshed',
    });
  }

  async sendVerification(userEmail: string, method: 'reset' | 'verify') {
    const token = await bcrypt.hash(userEmail, 10);
    await this.emailService.sendVerificationEmail(userEmail, token, method);
    await this.redisService.setToken(method, userEmail, token, 240);
    return {
      statusCode: HttpStatus.OK,
      message: `email sent! check your inbox`,
    };
  }

  async verifyEmail(email: string, token: string) {
    const sentToken = await this.redisService.getToken('verify', email);
    if (sentToken === token) {
      await this.userService.verify(email);
      await this.redisService.deleteToken('verify', email);
      return {
        statusCode: HttpStatus.OK,
        message: 'Email has verified!',
      };
    }
    return {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Invalid email or token or both',
    };
  }

  async resetPassword(body: ResetPassDto) {
    const sentToken = await this.redisService.getToken('reset', body.email);
    if (body.newPassword !== body.newPasswordConfirmation) {
      throw new BadRequestException(
        'new password and confirmation must be equal!',
      );
    }
    if (sentToken === body.token) {
      await this.userService.resetPassword(body.email, body.newPassword);
      await this.redisService.deleteToken('reset', body.email);
      return {
        statusCode: HttpStatus.OK,
        message: 'Password has reseted!',
      };
    }
    throw new NotFoundException({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Invalid email or token or both',
    });
  }
}
