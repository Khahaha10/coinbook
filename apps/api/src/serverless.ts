import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createApp } from './create-app';

let server: Promise<Express> | undefined;

async function boot(): Promise<Express> {
  const app = await createApp();
  await app.init();
  const instance: Express = app.getHttpAdapter().getInstance();
  return instance;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  server ??= boot().catch((e: unknown) => {
    server = undefined;
    throw e;
  });
  const express = await server;
  express(req, res);
}
