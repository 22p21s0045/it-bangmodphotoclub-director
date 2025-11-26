import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { MinioModule } from '../minio/minio.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    MinioModule,
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
