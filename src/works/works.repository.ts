import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ListParams = {
  limit: number;
  cursor?: number;
};

@Injectable()
export class WorksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany({ limit, cursor }: ListParams) {
    return this.prisma.work.findMany({
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findById(id: number) {
    return this.prisma.work.findUnique({
      where: { id },
    });
  }

  create(data: Prisma.WorkCreateInput) {
    return this.prisma.work.create({
      data,
    });
  }

  async update(id: number, data: Prisma.WorkUpdateInput) {
    try {
      return await this.prisma.work.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleNotFound(error);
    }
  }

  async delete(id: number) {
    try {
      await this.prisma.work.delete({
        where: { id },
      });
    } catch (error) {
      this.handleNotFound(error);
    }
  }

  private handleNotFound(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Work not found');
    }

    throw error;
  }
}
