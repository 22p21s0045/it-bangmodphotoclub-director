import { Injectable } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';
import { IMissionProgressCalculator } from '../interfaces';

/**
 * Calculator for event/join-based missions (AUTO_JOIN type)
 * Counts user's event participations to determine progress
 */
@Injectable()
export class EventMissionCalculator implements IMissionProgressCalculator {
  readonly type = MissionType.AUTO_JOIN;

  constructor(private readonly prisma: PrismaService) {}

  async calculate(userId: string, required: number): Promise<number> {
    const eventCount = await this.prisma.joinEvent.count({ where: { userId } });
    return Math.min(eventCount, required);
  }

  async shouldComplete(userId: string, required: number): Promise<boolean> {
    const eventCount = await this.prisma.joinEvent.count({ where: { userId } });
    return eventCount >= required;
  }
}
