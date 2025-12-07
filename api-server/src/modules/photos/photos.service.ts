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
    const photoType = createPhotoDto.type || 'RAW';
    this.logger.log(`Creating ${photoType} photo: ${createPhotoDto.filename} for event ${createPhotoDto.eventId}`);
    
    const photo = await this.prisma.photo.create({
      data: {
        eventId: createPhotoDto.eventId,
        userId: createPhotoDto.userId,
        filename: createPhotoDto.filename,
        url: createPhotoDto.url,
        size: 0,
        mimeType: 'image/jpeg',
        type: photoType,
      },
    });

    // Update event status based on photo type
    const event = await this.prisma.event.findUnique({
      where: { id: createPhotoDto.eventId },
    });

    if (event) {
      // RAW photo uploaded -> change PENDING_RAW to PENDING_EDIT
      if (photoType === 'RAW' && event.status === 'PENDING_RAW') {
        await this.prisma.event.update({
          where: { id: createPhotoDto.eventId },
          data: { status: 'PENDING_EDIT' },
        });
        this.logger.log(`Event ${createPhotoDto.eventId} status updated to PENDING_EDIT`);
      }
      // EDITED photo uploaded -> change PENDING_EDIT to COMPLETED
      else if (photoType === 'EDITED' && event.status === 'PENDING_EDIT') {
        await this.prisma.event.update({
          where: { id: createPhotoDto.eventId },
          data: { status: 'COMPLETED' },
        });
        this.logger.log(`Event ${createPhotoDto.eventId} status updated to COMPLETED`);
      }
    }

    // Queue image processing job - pass relative path for MinIO operations
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
