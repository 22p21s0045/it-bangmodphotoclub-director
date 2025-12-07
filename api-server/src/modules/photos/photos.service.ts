import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
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
      // EDITED photo uploaded -> always set to COMPLETED (skip RAW step if needed)
      else if (photoType === 'EDITED' && event.status !== 'COMPLETED') {
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

  async delete(id: string, userId: string, role: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: { event: { include: { joins: true } } },
    });

    if (!photo) {
      throw new NotFoundException(`ไม่พบรูปภาพ ID: ${id}`);
    }

    // Check authorization: Admin or event participant can delete
    const isAdmin = role === 'ADMIN';
    const isEventParticipant = photo.event?.joins?.some(j => j.userId === userId);
    const isUploader = photo.userId === userId;

    if (!isAdmin && !isEventParticipant && !isUploader) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบรูปภาพนี้');
    }

    // Delete from MinIO
    try {
      const photoPath = this.extractPathFromUrl(photo.url);
      await this.minioService.deleteObject(photoPath);
      
      // Also delete thumbnail if exists
      if (photo.thumbnailUrl) {
        const thumbnailPath = this.extractPathFromUrl(photo.thumbnailUrl);
        await this.minioService.deleteObject(thumbnailPath);
      }
    } catch (error) {
      this.logger.warn(`Could not delete photo from storage: ${error}`);
    }

    // Delete from database
    await this.prisma.photo.delete({ where: { id } });

    // Update event status if needed
    if (photo.eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: photo.eventId },
      });

      // If EDITED photo deleted, check if any EDITED photos remain
      if (photo.type === 'EDITED') {
        const remainingEditedPhotos = await this.prisma.photo.count({
          where: {
            eventId: photo.eventId,
            type: 'EDITED',
          },
        });

        // If no EDITED photos remain and event is COMPLETED, revert to PENDING_EDIT
        if (remainingEditedPhotos === 0 && event?.status === 'COMPLETED') {
          await this.prisma.event.update({
            where: { id: photo.eventId },
            data: { status: 'PENDING_EDIT' },
          });
          this.logger.log(`Event ${photo.eventId} status reverted to PENDING_EDIT (no EDITED photos remaining)`);
        }
      }
      
      // If RAW photo deleted, check if any RAW photos remain
      if (photo.type === 'RAW') {
        const remainingRawPhotos = await this.prisma.photo.count({
          where: {
            eventId: photo.eventId,
            type: 'RAW',
          },
        });

        // If no RAW photos remain and event is PENDING_EDIT, revert to PENDING_RAW
        if (remainingRawPhotos === 0 && event?.status === 'PENDING_EDIT') {
          await this.prisma.event.update({
            where: { id: photo.eventId },
            data: { status: 'PENDING_RAW' },
          });
          this.logger.log(`Event ${photo.eventId} status reverted to PENDING_RAW (no RAW photos remaining)`);
        }
      }
    }

    this.logger.log(`Photo ${id} deleted by user ${userId}`);
    return { message: 'ลบรูปภาพสำเร็จ' };
  }

  async batchDelete(photoIds: string[], userId: string, role: string) {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const photoId of photoIds) {
      try {
        await this.delete(photoId, userId, role);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Photo ${photoId}: ${error.message}`);
      }
    }

    this.logger.log(`Batch delete: ${results.success} success, ${results.failed} failed`);
    return {
      message: `ลบรูปภาพสำเร็จ ${results.success} รูป`,
      ...results,
    };
  }
}
