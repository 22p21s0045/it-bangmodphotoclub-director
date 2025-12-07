import { Injectable, Logger } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import { PrismaClient } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Injectable()
export class PhotosService {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(PhotosService.name);

  constructor(
    private readonly minioService: MinioService,
    @InjectQueue('image-processing') private imageQueue: Queue,
  ) {}

  async generatePresignedUrl(filename: string, eventId: string, userId: string) {
    const path = `photos/${eventId}/${userId}/${filename}`;
    const presignedUrl = await this.minioService.getPresignedUploadUrl(path);
    const publicUrl = this.minioService.getPublicUrl(path);
    return { 
      url: presignedUrl,  // For upload
      path,               // Relative path for worker
      publicUrl,          // Full URL to store in DB
    };
  }

  async create(createPhotoDto: CreatePhotoDto) {
    this.logger.log(`Creating photo: ${createPhotoDto.filename} for event ${createPhotoDto.eventId}`);
    
    const photo = await this.prisma.photo.create({
      data: {
        eventId: createPhotoDto.eventId,
        userId: createPhotoDto.userId,
        filename: createPhotoDto.filename,
        url: createPhotoDto.url, // This should now be the full public URL
        size: 0,
        mimeType: 'image/jpeg',
      },
    });

    // Queue image processing job - pass relative path for MinIO operations
    // Extract relative path from full URL if needed
    const relativePath = createPhotoDto.path || this.extractPathFromUrl(createPhotoDto.url);
    
    await this.imageQueue.add('process-image', {
      photoId: photo.id,
      fileKey: relativePath,
    });

    this.logger.log(`Photo created with ID: ${photo.id}, queued for processing`);
    return photo;
  }

  private extractPathFromUrl(url: string): string {
    // Extract path from full URL like http://localhost:9000/photos/photos/eventId/userId/filename
    const match = url.match(/\/photos\/(.+)$/);
    return match ? match[1] : url;
  }

  async findAll() {
    return this.prisma.photo.findMany();
  }
}
