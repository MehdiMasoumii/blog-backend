/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWTPayload } from '../entities/jwt.interface';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies['access_token']; // Extract JWT from cookie named 'access_token'
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET, // Your secret key for signing the JWT
    });
  }
  async validate(payload: JWTPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new Error('Unauthorized');
    }
    return user; // This will be attached to req.user
  }
}
