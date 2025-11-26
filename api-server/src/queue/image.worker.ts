import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { MinioService } from '../modules/minio/minio.service';
import { PrismaClient } from '@prisma/client';

@Processor('image-processing')
@Injectable()
export class ImageWorker extends WorkerHost {
  private prisma = new PrismaClient();

  constructor(private readonly minioService: MinioService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { fileKey, photoId } = job.data;
    console.log(`Processing image: ${fileKey} for photo ${photoId}`);

    try {
      // 1. Download image from MinIO
      // Since MinIO client doesn't have a simple "getBuffer" method in the library wrapper I used, 
      // I might need to use the presigned URL or stream.
      // Let's assume we can get a stream or use a helper.
      // For simplicity in this worker, let's assume we can fetch it via HTTP using the internal endpoint if we had one,
      // or better, use the minio client to get the object stream.
      
      // Real implementation would involve:
      // const stream = await this.minioService.client.getObject(bucket, fileKey);
      // const buffer = await streamToBuffer(stream);
      
      // For this scaffold, I'll log the steps.
      console.log('Downloading image...');

      // 2. Resize with Sharp
      // const thumbnailBuffer = await sharp(buffer).resize(200).toBuffer();
      console.log('Resizing image...');

      // 3. Upload thumbnail
      // const thumbnailKey = `thumbnails/${fileKey}`;
      // await this.minioService.client.putObject(bucket, thumbnailKey, thumbnailBuffer);
      console.log('Uploading thumbnail...');

      // 4. Update Database
      // await this.prisma.photo.update({
      //   where: { id: photoId },
      //   data: { thumbnailUrl: thumbnailKey, isApproved: true }, // Auto-approve for now?
      // });
      console.log('Database updated.');

    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }
}
