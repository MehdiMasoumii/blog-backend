import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/entities/user.schema';
import { JWTPayload } from './entities/jwt.interface';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
      });
    }
    const isPasswordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (isPasswordMatch) {
      return user;
    }
    return null;
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return await this.jwtService.signAsync(payload, {
      expiresIn: '60m',
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded: JWTPayload = await this.jwtService.verifyAsync(refreshToken); // Decoding the refresh token
    const user = await this.userService.findById(decoded.sub);
    if (!user) {
      throw new Error('User not found');
    }
    return this.generateAccessToken(user); // Generate a new access token for the user
  }

  async login(user: User, res: Response): Promise<any> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

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

    return res.send({
      statusCode: 200,
      message: 'Login successful',
    });
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
