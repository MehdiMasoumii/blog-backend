import { UserRoles } from './roles.enum';

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRoles;
  isVerified: boolean;
}
