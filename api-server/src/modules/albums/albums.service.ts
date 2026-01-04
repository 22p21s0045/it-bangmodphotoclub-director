import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlbumsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; description?: string; isPublic?: boolean }) {
    return this.prisma.album.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.album.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.album.findUnique({
      where: { id },
      include: {
        photos: true,
      },
    });
  }

  async addPhotos(id: string, photoIds: string[]) {
    return this.prisma.album.update({
      where: { id },
      data: {
        photos: {
          connect: photoIds.map((id) => ({ id })),
        },
      },
      include: { photos: true },
    });
  }

  async removePhotos(id: string, photoIds: string[]) {
    return this.prisma.album.update({
      where: { id },
      data: {
        photos: {
          disconnect: photoIds.map((id) => ({ id })),
        },
      },
      include: { photos: true },
    });
  }

  async delete(id: string) {
    return this.prisma.album.delete({
      where: { id },
    });
  }
}
