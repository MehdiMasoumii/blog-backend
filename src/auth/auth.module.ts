import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { EmailModule } from 'src/email/email.module';
import { RedisService } from 'src/redis.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Or use config service
      signOptions: { expiresIn: '60m' }, // Access token expiration time
    }),
    UsersModule,
    EmailModule,
  ],
  providers: [AuthService, JwtStrategy, RedisService],
  controllers: [AuthController],
})
export class AuthModule {}
