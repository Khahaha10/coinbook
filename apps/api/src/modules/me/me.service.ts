import { Injectable } from '@nestjs/common';
import { Prisma, type Profile } from '@prisma/client';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_WALLET,
  type MeDto,
  type UpdateMeInput,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';
import { toMeDto } from './me.mapper';

const FALLBACK_NAME = 'Kamu';

function displayName(user: AuthUser): string {
  const fromEmail = user.email?.split('@')[0];
  return (user.fullName ?? fromEmail ?? FALLBACK_NAME).trim().slice(0, 80) || FALLBACK_NAME;
}

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap(user: AuthUser): Promise<MeDto> {
    const existing = await this.prisma.profile.findUnique({ where: { id: user.id } });
    if (existing) return toMeDto(existing);
    try {
      const created = await this.createWithDefaults(user);
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
