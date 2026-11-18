import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type Profile } from '@prisma/client';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_WALLET,
  type MeDto,
  type UpdateMeInput,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { businessToday } from '../../common/clock';
import { AppError } from '../../common/errors/app-error';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { seedDemo } from '../demo/demo-seeder';
import { toMeDto } from './me.mapper';

const FALLBACK_NAME = 'Kamu';
const DEMO_SEED_TIMEOUT_MS = 30_000;

function displayName(user: AuthUser): string {
  const fromEmail = user.email?.split('@')[0];
  return (user.fullName ?? fromEmail ?? FALLBACK_NAME).trim().slice(0, 80) || FALLBACK_NAME;
}

@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async bootstrap(user: AuthUser, demo: boolean): Promise<MeDto> {
    const existing = await this.prisma.profile.findUnique({ where: { id: user.id } });
    if (existing) return toMeDto(existing);
    if (demo && !user.isAnonymous) {
      throw new AppError('VALIDATION_ERROR', 'Demo data is only available for anonymous sessions', {
        demo: 'anonymous session required',
      });
    }
    try {
      const created = demo ? await this.createDemo(user.id) : await this.createWithDefaults(user);
      return toMeDto(created);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return toMeDto(await this.prisma.profile.findUniqueOrThrow({ where: { id: user.id } }));
      }
      throw e;
    }
  }

  async get(userId: string): Promise<MeDto> {
    const profile = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) throw AppError.notFound('Profile');
    return toMeDto(profile);
  }

  async update(userId: string, input: UpdateMeInput): Promise<MeDto> {
    const profile = await this.prisma.profile.update({ where: { id: userId }, data: input });
    return toMeDto(profile);
  }

  private createDemo(userId: string): Promise<Profile> {
    return this.prisma.$transaction(
      (tx) =>
        seedDemo(tx, {
          userId,
          today: businessToday(this.env),
          useFixedShareTokens: this.env.COINBOOK_FIXED_TODAY !== undefined,
        }),
      { timeout: DEMO_SEED_TIMEOUT_MS },
    );
  }

  private createWithDefaults(user: AuthUser): Promise<Profile> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          id: user.id,
          name: displayName(user),
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
      });
      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          userId: user.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          isDefault: true,
        })),
      });
      await tx.wallet.create({
        data: { userId: user.id, name: DEFAULT_WALLET.name, type: DEFAULT_WALLET.type },
      });
      return profile;
    });
  }
}
