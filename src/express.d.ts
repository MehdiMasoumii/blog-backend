import { User } from './users/entities/user.schema';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Set your custom user type
    }
  }
}
