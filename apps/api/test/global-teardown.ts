import './global-setup';

export default function globalTeardown(): void {
  globalThis.__COINBOOK_API__?.kill();
}
