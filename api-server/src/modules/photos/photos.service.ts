import { Injectable } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import { PrismaClient } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotosService {
  private prisma = new PrismaClient();

  constructor(
    private readonly minioService: MinioService,
    @InjectQueue('image-processing') private imageQueue: Queue,
  ) {}

  async generatePresignedUrl(filename: string, eventId: string, userId: string) {
    const path = `photos/${eventId}/${userId}/${filename}`;
    const url = await this.minioService.getPresignedUploadUrl(path);
    return { url, path };
  }

  async create(createPhotoDto: CreatePhotoDto) {
    const photo = await this.prisma.photo.create({
      data: {
        eventId: createPhotoDto.eventId,
        userId: createPhotoDto.userId,
        filename: createPhotoDto.filename,
        url: createPhotoDto.url,
        size: 0,
        mimeType: 'image/jpeg',
      },
    });

    // Queue image processing job
    await this.imageQueue.add('process-image', {
      photoId: photo.id,
      fileKey: createPhotoDto.filename,
    });

    return photo;
  }

  async findAll() {
    return this.prisma.photo.findMany();
  }
}
