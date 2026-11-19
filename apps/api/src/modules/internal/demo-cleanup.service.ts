import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppError } from '../../common/errors/app-error';
import { ENV, type Env } from '../../config/env';
import { deleteUserData } from '../../database/delete-user-data';
import { PrismaService } from '../../database/prisma.service';

const BATCH_SIZE = 100;
const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 10_000;

export interface DemoCleanupResult {
  processed: number;
  deleted: number;
  failed: number;
}

@Injectable()
export class DemoCleanupService {
  private readonly logger = new Logger(DemoCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async run(): Promise<DemoCleanupResult> {
    const key = this.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new AppError('INTERNAL_ERROR', 'SUPABASE_SERVICE_ROLE_KEY is not configured');
    const cutoff = new Date(Date.now() - DEMO_TTL_MS);
    const result: DemoCleanupResult = { processed: 0, deleted: 0, failed: 0 };
    const failedIds: string[] = [];
    for (;;) {
      const batch = await this.prisma.profile.findMany({
        where: { isDemo: true, createdAt: { lt: cutoff }, id: { notIn: failedIds } },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });
      if (batch.length === 0) break;
      for (const { id } of batch) {
        result.processed += 1;
        try {
          await this.deleteAuthUser(id, key);
          await this.prisma.$transaction((tx) => deleteUserData(tx, id));
          result.deleted += 1;
        } catch (e: unknown) {
          result.failed += 1;
          failedIds.push(id);
          this.logger.warn(
            `Demo cleanup ${id} failed: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
      if (batch.length < BATCH_SIZE) break;
    }
    this.logger.log(`Demo cleanup: ${JSON.stringify(result)}`);
    return result;
  }

  private async deleteAuthUser(id: string, key: string): Promise<void> {
    const res = await fetch(`${this.env.SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok && res.status !== 404) throw new Error(`Supabase admin responded ${res.status}`);
  }
}
