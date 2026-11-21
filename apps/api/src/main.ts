import { loadEnv } from './config/env';
import { createApp } from './create-app';

async function bootstrap(): Promise<void> {
  const app = await createApp();
  app.enableShutdownHooks();
  await app.listen(loadEnv().PORT);
}

void bootstrap();
