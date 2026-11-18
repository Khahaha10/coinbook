import type { Request } from 'express';

export interface AuthUser {
  id: string;
  isAnonymous: boolean;
}

export interface AppRequest extends Request {
  user?: AuthUser;
}
