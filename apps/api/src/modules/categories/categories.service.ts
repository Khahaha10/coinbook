import { Injectable } from '@nestjs/common';
import type { Category } from '@prisma/client';
import {
  DEFAULT_CATEGORIES,
  type CategoryDto,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@coinbook/shared';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';

const DEFAULT_ORDER = new Map(DEFAULT_CATEGORIES.map((c, i) => [`${c.type}:${c.name}`, i]));

function rank(c: Category): number {
  return DEFAULT_ORDER.get(`${c.type}:${c.name}`) ?? Number.MAX_SAFE_INTEGER;
}

function compare(a: Category, b: Category): number {
  if (a.type !== b.type) return a.type === 'EXPENSE' ? -1 : 1;
  return rank(a) - rank(b) || a.name.localeCompare(b.name, 'id');
}

function toCategoryDto(c: Category): CategoryDto {
  return { id: c.id, name: c.name, type: c.type, icon: c.icon, isDefault: c.isDefault };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CategoryDto[]> {
    const categories = await this.prisma.category.findMany({ where: { userId } });
    return [...categories].sort(compare).map(toCategoryDto);
  }

  async create(userId: string, input: CreateCategoryInput): Promise<CategoryDto> {
    const category = await this.prisma.category.create({ data: { userId, ...input } });
    return toCategoryDto(category);
  }

  async update(userId: string, id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    await this.owned(userId, id);
    const category = await this.prisma.category.update({ where: { id }, data: input });
    return toCategoryDto(category);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.owned(userId, id);
    const [transactions, bills] = await Promise.all([
      this.prisma.transaction.count({ where: { categoryId: id } }),
      this.prisma.bill.count({ where: { categoryId: id } }),
    ]);
    if (transactions + bills > 0) {
      throw new AppError('CATEGORY_IN_USE', 'Category is used by transactions or bills');
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async owned(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw AppError.notFound('Category');
    return category;
  }
}
