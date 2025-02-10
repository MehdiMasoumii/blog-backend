import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Roles } from '../decorators/roles.decorator';
import { Request } from 'express';
import { UserRoles } from 'src/auth/entities/roles.enum';
import { JWTPayload } from 'src/auth/entities/jwt.interface';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const req: Request & {
      user: JWTPayload;
    } = context.switchToHttp().getRequest();
    const user: JWTPayload = req.user;
    return matchRoles(requiredRoles, user.role);
  }
}

function matchRoles(requiredRoles: UserRoles[], userRole: UserRoles): boolean {
  return requiredRoles.some((role) => role === userRole);
}
