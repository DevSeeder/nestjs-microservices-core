export interface JWTPayload {
  username: string;
  scopes: string[];
  userId: string;
}
