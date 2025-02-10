import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserSafe } from 'src/users/entities/user.schema';

// this param decorator can be used after authGuard and returns user jwt payload
export const User = createParamDecorator(
  (data: keyof UserSafe, context: ExecutionContext) => {
    const req: Request & {
      user: UserSafe;
    } = context.switchToHttp().getRequest();

    const user: UserSafe | undefined = req.user;
    if (!data) {
      return user;
    }
    return user[data];
  },
);
