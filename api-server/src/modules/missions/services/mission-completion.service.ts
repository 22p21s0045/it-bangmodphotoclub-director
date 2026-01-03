import { Injectable } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { PrismaService } from '../../../prisma.service';
import { CalculatorFactoryService } from '../calculators';
import { RankService } from './rank.service';
import { extractRequired, PHOTO_MILESTONES, EVENT_MILESTONES } from '../config/missions.config';

/**
 * Service dedicated to mission completion logic (Single Responsibility Principle)
 * Handles completing missions and auto-completion checks
 */
@Injectable()
export class MissionCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculatorFactory: CalculatorFactoryService,
    private readonly rankService: RankService,
  ) {}

  /**
   * Complete a mission for a user
   */
  async completeMission(userId: string, missionId: string) {
    // Check if already completed
    const existingCompletion = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    if (existingCompletion) {
      return { success: false, message: 'ทำภารกิจนี้ไปแล้ว' };
    }

    // Get mission details
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });

    if (!mission || !mission.isActive) {
      return { success: false, message: 'ไม่พบภารกิจนี้' };
    }

    // Complete mission and add EXP
    await this.prisma.$transaction([
      this.prisma.userMission.create({
        data: { userId, missionId },
      }),
      this.prisma.userLevel.upsert({
        where: { userId },
        update: { exp: { increment: mission.expReward } },
        create: { userId, exp: mission.expReward, level: 1 },
      }),
    ]);

    const newRank = await this.rankService.getUserRank(userId);

    return {
      success: true,
      message: `ได้รับ ${mission.expReward} EXP!`,
      expEarned: mission.expReward,
      newExp: newRank.exp,
      rank: newRank.rank,
    };
  }

  /**
   * Auto-check and complete missions based on user stats
   */
  async checkAndCompleteMissions(userId: string): Promise<void> {
    // Get all active missions
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
    });

    // Get already completed missions
    const completedMissions = await this.prisma.userMission.findMany({
      where: { userId },
      select: { missionId: true },
    });
    const completedIds = new Set(completedMissions.map((m) => m.missionId));

    // Check each mission for auto-completion
    for (const mission of missions) {
      if (completedIds.has(mission.id)) continue;
      if (mission.type === MissionType.MANUAL) continue;

      const milestones = mission.type === MissionType.AUTO_PHOTO 
        ? PHOTO_MILESTONES 
        : EVENT_MILESTONES;

      const milestone = milestones.find((m) => mission.description.includes(m.keyword));
      if (!milestone) continue;

      const calculator = this.calculatorFactory.getCalculator(mission.type);
      const shouldComplete = await calculator.shouldComplete(userId, milestone.required);

      if (shouldComplete) {
        await this.completeMission(userId, mission.id);
      }
    }
  }

  /**
   * Get user missions with progress calculated using strategy pattern
   */
  async getUserMissionsWithProgress(userId: string) {
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
      orderBy: { expReward: 'asc' },
    });

    const completedMissions = await this.prisma.userMission.findMany({
      where: { userId },
      select: { missionId: true, completedAt: true },
    });

    const completedMap = new Map(
      completedMissions.map((m) => [m.missionId, m.completedAt]),
    );

    const results = await Promise.all(
      missions.map(async (mission) => {
        const required = extractRequired(mission.description);
        const calculator = this.calculatorFactory.getCalculator(mission.type);
        
        let current: number;
        if (completedMap.has(mission.id)) {
          current = required; // Already completed
        } else {
          current = await calculator.calculate(userId, required);
        }

        return {
          ...mission,
          completed: completedMap.has(mission.id),
          completedAt: completedMap.get(mission.id) || null,
          progress: {
            current,
            required,
          },
        };
      }),
    );

    return results;
  }
}
