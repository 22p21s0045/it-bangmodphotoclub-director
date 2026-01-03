import { Controller, Get, Post, Delete, Patch, Param, Body } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { MissionsService } from './missions.service';
import { RankService, MissionCompletionService } from './services';

@Controller('missions')
export class MissionsController {
  constructor(
    private readonly missionsService: MissionsService,
    private readonly rankService: RankService,
    private readonly completionService: MissionCompletionService,
  ) {}

  @Get()
  getAllMissions() {
    return this.missionsService.getAllMissions();
  }

  @Get('user/:userId')
  async getUserMissions(@Param('userId') userId: string) {
    // Auto-check and complete missions based on current stats
    await this.completionService.checkAndCompleteMissions(userId);
    return this.completionService.getUserMissionsWithProgress(userId);
  }

  @Get('rank/:userId')
  getUserRank(@Param('userId') userId: string) {
    return this.rankService.getUserRank(userId);
  }

  @Post(':missionId/complete/:userId')
  completeMission(
    @Param('missionId') missionId: string,
    @Param('userId') userId: string,
  ) {
    return this.completionService.completeMission(userId, missionId);
  }

  @Post()
  createMission(@Body() data: { 
    title: string; 
    description: string; 
    expReward: number; 
    type?: MissionType;
  }) {
    return this.missionsService.createMission(data);
  }

  @Post('fix-types')
  async fixMissionTypes() {
    return this.missionsService.fixMissionTypes();
  }

  @Delete(':id')
  deleteMission(@Param('id') id: string) {
    return this.missionsService.deleteMission(id);
  }

  @Patch(':id')
  updateMission(
    @Param('id') id: string,
    @Body() data: { 
      title?: string; 
      description?: string; 
      expReward?: number; 
      type?: MissionType;
    },
  ) {
    return this.missionsService.updateMission(id, data);
  }
}
