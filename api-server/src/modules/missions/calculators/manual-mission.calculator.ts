import { Injectable } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';
import { IMissionProgressCalculator } from '../interfaces';

/**
 * Calculator for manual missions (MANUAL type)
 * Checks if mission was manually completed by user
 */
@Injectable()
export class ManualMissionCalculator implements IMissionProgressCalculator {
  readonly type = MissionType.MANUAL;

  constructor(private readonly prisma: PrismaService) {}

  async calculate(userId: string, required: number): Promise<number> {
    // Manual missions don't have incremental progress
    // They are either completed (required) or not (0)
    return 0;
  }

  async shouldComplete(_userId: string, _required: number): Promise<boolean> {
    // Manual missions should never auto-complete
    return false;
  }
}
