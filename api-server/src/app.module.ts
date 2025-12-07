import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { MinioModule } from './modules/minio/minio.module';
import { PhotosModule } from './modules/photos/photos.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ImageWorker } from './queue/image.worker';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          url: configService.get('REDIS_URL'),
        },
      }),
      inject: [ConfigService],
    }),
    MinioModule,
    PhotosModule,
    UsersModule,
    EventsModule,
    AuthModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [ImageWorker],
})
export class AppModule {}
