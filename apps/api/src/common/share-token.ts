import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const SHARE_TOKEN_LENGTH = 11;

export function generateShareToken(): string {
  let token = '';
  for (const byte of randomBytes(SHARE_TOKEN_LENGTH)) token += ALPHABET.charAt(byte & 63);
  return token;
}
