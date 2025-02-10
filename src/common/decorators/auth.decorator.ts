import { applyDecorators, UseGuards } from '@nestjs/common';
import { UserRoles } from 'src/auth/entities/roles.enum';
import { RoleGuard } from '../guards/roles.guard';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from './roles.decorator';

export function Auth(...roles: UserRoles[]) {
  return applyDecorators(UseGuards(AuthGuard, RoleGuard), Roles(roles));
}
