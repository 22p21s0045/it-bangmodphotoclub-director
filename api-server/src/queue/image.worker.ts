import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as sharp from 'sharp';
import { exiftool } from 'exiftool-vendored';
import { MinioService } from '../modules/minio/minio.service';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

@Processor('image-processing')
@Injectable()
export class ImageWorker extends WorkerHost implements OnModuleDestroy {
  private prisma = new PrismaClient();
  private readonly logger = new Logger(ImageWorker.name);

  constructor(private readonly minioService: MinioService) {
    super();
  }

  async onModuleDestroy() {
    // Clean up exiftool process
    await exiftool.end();
  }

  async process(job: Job<{ fileKey: string; photoId: string }, any, string>): Promise<any> {
    const { fileKey, photoId } = job.data;
    this.logger.log(`Processing image: ${fileKey} for photo ${photoId}`);

    // Create temp file path
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `raw_${photoId}_${Date.now()}`);
    const tempPreviewPath = `${tempFilePath}_preview.jpg`;

    try {
      // 1. Download RAW file from MinIO
      this.logger.log('Downloading RAW file from MinIO...');
      const stream = await this.minioService.getObject(fileKey);
      const chunks: Buffer[] = [];
      
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      this.logger.log(`Downloaded ${buffer.length} bytes`);

      // Save to temp file for exiftool
      await fs.writeFile(tempFilePath, buffer);

      // 2. Extract embedded preview using exiftool
      this.logger.log('Extracting embedded preview using exiftool...');
      let thumbnailBuffer: Buffer;

      try {
        // Try to extract embedded preview from RAW file
        const tags = await exiftool.read(tempFilePath);
        
        // Log available metadata
        this.logger.log(`File type: ${tags.FileType}, MIME: ${tags.MIMEType}`);
        
        // Extract preview image - exiftool can extract embedded previews
        await exiftool.extractPreview(tempFilePath, tempPreviewPath);
        
        // Read the extracted preview
        const previewExists = await fs.access(tempPreviewPath).then(() => true).catch(() => false);
        
        if (previewExists) {
          const previewBuffer = await fs.readFile(tempPreviewPath);
          this.logger.log(`Extracted preview: ${previewBuffer.length} bytes`);
          
          // Resize to thumbnail size using sharp
          thumbnailBuffer = await sharp(previewBuffer)
            .rotate() // Auto-rotate based on EXIF
            .resize(400, 400, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 80 })
            .toBuffer();
        } else {
          // Fallback: try to process directly with Sharp
          this.logger.warn('No embedded preview found, trying Sharp directly...');
          thumbnailBuffer = await sharp(buffer, { failOnError: false })
            .rotate()
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
        }

        // Store metadata in database
        const metadata = {
          fileType: tags.FileType,
          mimeType: tags.MIMEType,
          imageWidth: tags.ImageWidth,
          imageHeight: tags.ImageHeight,
          make: tags.Make,
          model: tags.Model,
          iso: tags.ISO,
          exposureTime: tags.ExposureTime,
          fNumber: tags.FNumber,
          focalLength: tags.FocalLength,
          dateTimeOriginal: tags.DateTimeOriginal?.toString(),
          lens: tags.LensModel || tags.Lens,
        };

        this.logger.log(`Metadata extracted: ${JSON.stringify(metadata)}`);

        // Update photo with metadata
        await this.prisma.photo.update({
          where: { id: photoId },
          data: {
            metadata: metadata,
            width: tags.ImageWidth,
            height: tags.ImageHeight,
            mimeType: tags.MIMEType || 'image/x-raw',
          },
        });

      } catch (exifError) {
        this.logger.warn(`Exiftool extraction failed: ${exifError.message}, trying Sharp...`);
        // Fallback to Sharp
        thumbnailBuffer = await sharp(buffer, { failOnError: false })
          .rotate()
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      this.logger.log(`Generated thumbnail: ${thumbnailBuffer.length} bytes`);

      // 3. Generate thumbnail path
      // fileKey format: photos/{eventId}/{userId}/{filename}
      const pathParts = fileKey.split('/');
      const eventId = pathParts[1];
      const filename = pathParts[pathParts.length - 1];
      const thumbnailFilename = filename.replace(/\.[^.]+$/, '.jpg');
      const thumbnailKey = `thumbnails/${eventId}/${thumbnailFilename}`;

      // 4. Upload thumbnail to MinIO
      this.logger.log(`Uploading thumbnail to: ${thumbnailKey}`);
      await this.minioService.putObject(thumbnailKey, thumbnailBuffer, 'image/jpeg');

      // 5. Generate full public URL for thumbnail
      const thumbnailUrl = this.minioService.getPublicUrl(thumbnailKey);

      // 6. Update Database with full thumbnail URL
      await this.prisma.photo.update({
        where: { id: photoId },
        data: { 
          thumbnailUrl: thumbnailUrl,
          size: buffer.length,
        },
      });

      this.logger.log(`Successfully processed photo ${photoId}`);
      return { success: true, thumbnailKey, thumbnailUrl };

    } catch (error) {
      this.logger.error(`Error processing image ${photoId}:`, error);
      
      // Update photo to mark processing failed
      await this.prisma.photo.update({
        where: { id: photoId },
        data: { 
          metadata: { processingError: error.message }
        },
      });
      
      throw error;
    } finally {
      // Clean up temp files
      try {
        await fs.unlink(tempFilePath).catch(() => {});
        await fs.unlink(tempPreviewPath).catch(() => {});
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}
