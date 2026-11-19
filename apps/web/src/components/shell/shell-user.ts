import type { ShellUser } from './app-shell';

export function toShellUser(name: string): ShellUser {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return { name, initials };
}
