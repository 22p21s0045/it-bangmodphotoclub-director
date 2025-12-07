import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface RankInfo {
  name: string;
  minExp: number;
  maxExp: number;
  image: string;
}

const RANKS: RankInfo[] = [
  { name: 'Rookie', minExp: 0, maxExp: 99, image: '/images/ranks/rookie.svg' },
  { name: 'Intermediate', minExp: 100, maxExp: 299, image: '/images/ranks/intermediate.svg' },
  { name: 'Master', minExp: 300, maxExp: 599, image: '/images/ranks/master.svg' },
  { name: 'Grand Master', minExp: 600, maxExp: Infinity, image: '/images/ranks/grand-master.svg' },
];

@Injectable()
export class MissionsService {
  private prisma = new PrismaClient();

  getRankFromExp(exp: number): RankInfo {
    return RANKS.find((r) => exp >= r.minExp && exp <= r.maxExp) || RANKS[0];
  }

  getNextRank(exp: number): RankInfo | null {
    const currentIndex = RANKS.findIndex((r) => exp >= r.minExp && exp <= r.maxExp);
    return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
  }

  async getAllMissions() {
    return this.prisma.mission.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserMissions(userId: string) {
    // Get all missions with user completion status
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const completedMissions = await this.prisma.userMission.findMany({
      where: { userId },
      select: { missionId: true, completedAt: true },
    });

    const completedMap = new Map(
      completedMissions.map((m) => [m.missionId, m.completedAt]),
    );

    return missions.map((mission) => ({
      ...mission,
      completed: completedMap.has(mission.id),
      completedAt: completedMap.get(mission.id) || null,
    }));
  }

  async getUserRank(userId: string) {
    let userLevel = await this.prisma.userLevel.findUnique({
      where: { userId },
    });

    // Create level if not exists
    if (!userLevel) {
      userLevel = await this.prisma.userLevel.create({
        data: { userId, exp: 0, level: 1 },
      });
    }

    const currentRank = this.getRankFromExp(userLevel.exp);
    const nextRank = this.getNextRank(userLevel.exp);

    // Calculate progress to next rank
    let progress = 100;
    if (nextRank) {
      const expInCurrentRank = userLevel.exp - currentRank.minExp;
      const expToNextRank = nextRank.minExp - currentRank.minExp;
      progress = Math.min(100, Math.round((expInCurrentRank / expToNextRank) * 100));
    }

    return {
      exp: userLevel.exp,
      level: userLevel.level,
      rank: currentRank,
      nextRank,
      progress,
      expToNextRank: nextRank ? nextRank.minExp - userLevel.exp : 0,
    };
  }

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

    const newRank = await this.getUserRank(userId);

    return {
      success: true,
      message: `ได้รับ ${mission.expReward} EXP!`,
      expEarned: mission.expReward,
      newExp: newRank.exp,
      rank: newRank.rank,
    };
  }

  async createMission(data: { title: string; description: string; expReward: number }) {
    return this.prisma.mission.create({
      data: {
        title: data.title,
        description: data.description,
        expReward: data.expReward,
      },
    });
  }
}
