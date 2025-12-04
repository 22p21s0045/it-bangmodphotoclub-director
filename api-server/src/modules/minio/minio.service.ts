import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'photos');
  }

  onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost').replace('http://', '').replace('https://', '').split(':')[0],
      port: parseInt(this.configService.get<string>('MINIO_ENDPOINT', 'localhost').split(':')[2] || '9000'),
      useSSL: this.configService.get<string>('MINIO_ENDPOINT', '').startsWith('https'),
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
    
    // Ensure bucket exists
    this.ensureBucket();
  }

  async ensureBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`Bucket ${this.bucketName} created.`);
      }

      // Set public policy
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };
      await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
    } catch (err) {
      console.error('Error checking/creating bucket:', err);
    }
  }

  async getPresignedUploadUrl(filename: string, expiry: number = 3600): Promise<string> {
    return await this.minioClient.presignedPutObject(this.bucketName, filename, expiry);
  }

  async getPresignedDownloadUrl(filename: string, expiry: number = 3600): Promise<string> {
    return await this.minioClient.presignedGetObject(this.bucketName, filename, expiry);
  }
}
