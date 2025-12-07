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
      orderBy: { expReward: 'asc' },
    });

    // Get user stats
    const [photoCount, eventCount] = await Promise.all([
      this.prisma.photo.count({ where: { userId } }),
      this.prisma.joinEvent.count({ where: { userId } }),
    ]);

    const completedMissions = await this.prisma.userMission.findMany({
      where: { userId },
      select: { missionId: true, completedAt: true },
    });

    const completedMap = new Map(
      completedMissions.map((m) => [m.missionId, m.completedAt]),
    );

    // Extract required count from description
    const extractRequired = (description: string): number => {
      const match = description.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 1;
    };

    return missions.map((mission) => {
      const required = extractRequired(mission.description);
      let current = 0;

      if (mission.type === 'AUTO_PHOTO') {
        current = Math.min(photoCount, required);
      } else if (mission.type === 'AUTO_JOIN') {
        current = Math.min(eventCount, required);
      } else {
        // MANUAL type - check if completed
        current = completedMap.has(mission.id) ? required : 0;
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
    });
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

  async createMission(data: { title: string; description: string; expReward: number; type?: string }) {
    return this.prisma.mission.create({
      data: {
        title: data.title,
        description: data.description,
        expReward: data.expReward,
        type: (data.type as any) || 'MANUAL',
      },
    });
  }

  async fixMissionTypes() {
    const missions = await this.prisma.mission.findMany();
    
    for (const mission of missions) {
      let newType = 'MANUAL';
      
      if (mission.description.includes('รูป')) {
        newType = 'AUTO_PHOTO';
      } else if (mission.description.includes('ครั้ง')) {
        newType = 'AUTO_JOIN';
      }

      await this.prisma.mission.update({
        where: { id: mission.id },
        data: { type: newType as any },
      });
    }

    return { success: true, message: 'Fixed all mission types' };
  }

  async deleteMission(id: string) {
    // First delete all user completions for this mission
    await this.prisma.userMission.deleteMany({
      where: { missionId: id },
    });

    // Then delete the mission
    await this.prisma.mission.delete({
      where: { id },
    });

    return { success: true, message: 'Mission deleted' };
  }

  async updateMission(id: string, data: { title?: string; description?: string; expReward?: number; type?: string }) {
    return this.prisma.mission.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.expReward && { expReward: data.expReward }),
        ...(data.type && { type: data.type as any }),
      },
    });
  }

  // Auto-check and complete missions based on user stats
  async checkAndCompleteMissions(userId: string) {
    // Get user stats
    const [photoCount, eventCount] = await Promise.all([
      this.prisma.photo.count({ where: { userId } }),
      this.prisma.joinEvent.count({ where: { userId } }),
    ]);

    // Map mission descriptions to required counts
    const photoMilestones = [
      { keyword: '5 รูป', required: 5 },
      { keyword: '15 รูป', required: 15 },
      { keyword: '30 รูป', required: 30 },
      { keyword: '50 รูป', required: 50 },
      { keyword: '10 รูป', required: 10 },
    ];

    const eventMilestones = [
      { keyword: '1 ครั้ง', required: 1 },
      { keyword: '3 ครั้ง', required: 3 },
      { keyword: '5 ครั้ง', required: 5 },
      { keyword: '10 ครั้ง', required: 10 },
    ];

    // Get all missions
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true },
    });

    // Get already completed missions
    const completedMissions = await this.prisma.userMission.findMany({
      where: { userId },
      select: { missionId: true },
    });
    const completedIds = new Set(completedMissions.map((m) => m.missionId));

    // Check and complete AUTO_PHOTO missions
    for (const mission of missions) {
      if (completedIds.has(mission.id)) continue;

      let shouldComplete = false;

      if (mission.type === 'AUTO_PHOTO') {
        const milestone = photoMilestones.find((m) => mission.description.includes(m.keyword));
        if (milestone && photoCount >= milestone.required) {
          shouldComplete = true;
        }
      } else if (mission.type === 'AUTO_JOIN') {
        const milestone = eventMilestones.find((m) => mission.description.includes(m.keyword));
        if (milestone && eventCount >= milestone.required) {
          shouldComplete = true;
        }
      }

      if (shouldComplete) {
        await this.completeMission(userId, mission.id);
      }
    }
  }
}
