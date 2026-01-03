import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { RankInfo, RANKS } from '../config/missions.config';

/**
 * Service dedicated to rank calculations (Single Responsibility Principle)
 * Handles all rank-related logic: getting current rank, next rank, and progress
 */
@Injectable()
export class RankService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get rank information from experience points
   */
  getRankFromExp(exp: number): RankInfo {
    return RANKS.find((r) => exp >= r.minExp && exp <= r.maxExp) || RANKS[0];
  }

  /**
   * Get the next rank tier, or null if at max rank
   */
  getNextRank(exp: number): RankInfo | null {
    const currentIndex = RANKS.findIndex((r) => exp >= r.minExp && exp <= r.maxExp);
    return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
  }

  /**
   * Calculate progress percentage to next rank
   */
  calculateProgress(exp: number): number {
    const currentRank = this.getRankFromExp(exp);
    const nextRank = this.getNextRank(exp);

    if (!nextRank) {
      return 100; // Max rank reached
    }

    const expInCurrentRank = exp - currentRank.minExp;
    const expToNextRank = nextRank.minExp - currentRank.minExp;
    return Math.min(100, Math.round((expInCurrentRank / expToNextRank) * 100));
  }

  /**
   * Get complete rank information for a user
   */
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
    const progress = this.calculateProgress(userLevel.exp);

    return {
      exp: userLevel.exp,
      level: userLevel.level,
      rank: currentRank,
      nextRank,
      progress,
      expToNextRank: nextRank ? nextRank.minExp - userLevel.exp : 0,
    };
  }

  /**
   * Add experience points to a user
   */
  async addExp(userId: string, amount: number) {
    return this.prisma.userLevel.upsert({
      where: { userId },
      update: { exp: { increment: amount } },
      create: { userId, exp: amount, level: 1 },
    });
  }
}
