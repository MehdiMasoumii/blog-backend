import { Reflector } from '@nestjs/core';
import { UserRoles } from 'src/auth/entities/roles.enum';

export const Roles = Reflector.createDecorator<UserRoles[]>();
