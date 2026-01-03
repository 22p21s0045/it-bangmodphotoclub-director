import { Injectable } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';
import { IMissionProgressCalculator } from '../interfaces';

/**
 * Calculator for photo-based missions (AUTO_PHOTO type)
 * Counts user's uploaded photos to determine progress
 */
@Injectable()
export class PhotoMissionCalculator implements IMissionProgressCalculator {
  readonly type = MissionType.AUTO_PHOTO;

  constructor(private readonly prisma: PrismaService) {}

  async calculate(userId: string, required: number): Promise<number> {
    const photoCount = await this.prisma.photo.count({ where: { userId } });
    return Math.min(photoCount, required);
  }

  async shouldComplete(userId: string, required: number): Promise<boolean> {
    const photoCount = await this.prisma.photo.count({ where: { userId } });
    return photoCount >= required;
  }
}
