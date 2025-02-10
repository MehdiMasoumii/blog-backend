/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWTPayload } from '../entities/jwt.interface';
import { UsersService } from 'src/users/users.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => {
          const access_token: string | undefined = req.cookies['access_token'];
          if (!access_token) {
            throw new UnauthorizedException({
              statusCode: HttpStatus.UNAUTHORIZED,
              message: 'Unauthorized!',
            });
          }
          return access_token; // Extract JWT from cookie named 'access_token'
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'Secret Key HERE', // Your secret key for signing the JWT
    });
  }

  async validate(payload: JWTPayload) {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new Error('Unauthorized');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, __v, ...userSafe } = user.toJSON();

    return userSafe; // This will be attached to req.user
  }
}
