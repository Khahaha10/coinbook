import type { Request } from 'express';

export interface AuthUser {
  id: string;
  isAnonymous: boolean;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface AppRequest extends Request {
  user?: AuthUser;
}
