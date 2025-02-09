export interface JWTPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}
