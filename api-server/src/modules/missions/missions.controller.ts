import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  getAllMissions() {
    return this.missionsService.getAllMissions();
  }

  @Get('user/:userId')
  async getUserMissions(@Param('userId') userId: string) {
    // Auto-check and complete missions based on current stats
    await this.missionsService.checkAndCompleteMissions(userId);
    return this.missionsService.getUserMissions(userId);
  }

  @Get('rank/:userId')
  getUserRank(@Param('userId') userId: string) {
    return this.missionsService.getUserRank(userId);
  }

  @Post(':missionId/complete/:userId')
  completeMission(
    @Param('missionId') missionId: string,
    @Param('userId') userId: string,
  ) {
    return this.missionsService.completeMission(userId, missionId);
  }

  @Post()
  createMission(@Body() data: { title: string; description: string; expReward: number; type?: string }) {
    return this.missionsService.createMission(data);
  }

  @Post('fix-types')
  async fixMissionTypes() {
    return this.missionsService.fixMissionTypes();
  }
}
