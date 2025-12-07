import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MinioModule } from '../minio/minio.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [MinioModule, ActivityLogModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
