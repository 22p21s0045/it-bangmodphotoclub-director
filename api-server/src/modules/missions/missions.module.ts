import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';
import { PrismaService } from '../../prisma.service';

// Services
import { RankService, MissionCompletionService } from './services';

// Calculators (Strategy Pattern)
import {
  PhotoMissionCalculator,
  EventMissionCalculator,
  ManualMissionCalculator,
  CalculatorFactoryService,
} from './calculators';

@Module({
  controllers: [MissionsController],
  providers: [
    // Database
    PrismaService,
    
    // Core Services
    MissionsService,
    RankService,
    MissionCompletionService,
    
    // Strategy Pattern Calculators
    PhotoMissionCalculator,
    EventMissionCalculator,
    ManualMissionCalculator,
    CalculatorFactoryService,
  ],
  exports: [
    MissionsService, 
    RankService, 
    MissionCompletionService,
  ],
})
export class MissionsModule {}
