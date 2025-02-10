import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User as UserSchema } from 'src/users/entities/user.schema';

// this param decorator can be used after authGuard and returns user jwt payload
export const User = createParamDecorator(
  (data: keyof UserSchema, context: ExecutionContext) => {
    const req: Request & {
      user: UserSchema;
    } = context.switchToHttp().getRequest();

    const user: UserSchema | undefined = req.user;
    if (!data) {
      return user;
    }
    return user[data];
  },
);
