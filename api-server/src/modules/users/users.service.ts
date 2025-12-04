import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    return this.prisma.user.create({
      data: {
        ...data,
        password: data.password || "", // Should hash password in real app
      },
    });
  }

  async update(id: string, data: { role?: 'USER' | 'ADMIN'; isActive?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
