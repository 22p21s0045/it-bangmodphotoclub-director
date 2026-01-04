import { Injectable } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

/**
 * Service for mission CRUD operations
 * Following Single Responsibility Principle - only handles mission entity operations
 * 
 * Rank calculations delegated to RankService
 * Completion logic delegated to MissionCompletionService
 */
@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active missions
   */
  async getAllMissions() {
    return this.prisma.mission.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new mission
   */
  async createMission(data: { 
    title: string; 
    description: string; 
    expReward: number; 
    type?: MissionType;
  }) {
    return this.prisma.mission.create({
      data: {
        title: data.title,
        description: data.description,
        expReward: data.expReward,
        type: data.type || MissionType.MANUAL,
      },
    });
  }

  /**
   * Update an existing mission
   */
  async updateMission(
    id: string, 
    data: { 
      title?: string; 
      description?: string; 
      expReward?: number; 
      type?: MissionType;
    }
  ) {
    return this.prisma.mission.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.expReward && { expReward: data.expReward }),
        ...(data.type && { type: data.type }),
      },
    });
  }

  /**
   * Delete a mission and its completions
   */
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

  /**
   * Fix mission types based on description keywords
   * (Migration/utility method)
   */
  async fixMissionTypes() {
    const missions = await this.prisma.mission.findMany();

    for (const mission of missions) {
      let newType: MissionType = MissionType.MANUAL;

      if (mission.description.includes('รูป')) {
        newType = MissionType.AUTO_PHOTO;
      } else if (mission.description.includes('ครั้ง')) {
        newType = MissionType.AUTO_JOIN;
      }

      await this.prisma.mission.update({
        where: { id: mission.id },
        data: { type: newType },
      });
    }

    return { success: true, message: 'Fixed all mission types' };
  }
}
