import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosController } from './photos.controller';
import { MinioModule } from '../minio/minio.module';
import { BullModule } from '@nestjs/bullmq';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [
    MinioModule,
    BullModule.registerQueue({
      name: 'image-processing',
    }),
    ActivityLogModule,
  ],
  controllers: [PhotosController],
  providers: [PhotosService],
})
export class PhotosModule {}
