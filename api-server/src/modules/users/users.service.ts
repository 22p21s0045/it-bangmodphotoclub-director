import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  constructor(private readonly minioService: MinioService) {}

  async generateAvatarUploadUrl(userId: string, filename: string) {
    const path = `avatars/${userId}/${filename}`;
    const url = await this.minioService.getPresignedUploadUrl(path);
    return { url, path };
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any) {
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : "";
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async update(id: string, data: { name?: string; avatar?: string; password?: string; role?: 'USER' | 'ADMIN'; isActive?: boolean }) {
    const updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
