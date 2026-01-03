import { Injectable } from '@nestjs/common';
import { MissionType } from '@prisma/client';
import { IMissionProgressCalculator } from '../interfaces';
import { PhotoMissionCalculator } from './photo-mission.calculator';
import { EventMissionCalculator } from './event-mission.calculator';
import { ManualMissionCalculator } from './manual-mission.calculator';

/**
 * Factory for mission progress calculators
 * Returns the appropriate calculator based on mission type
 * 
 * This follows the Open/Closed Principle:
 * - To add a new mission type, create a new calculator and register it here
 * - No need to modify existing calculator implementations
 */
@Injectable()
export class CalculatorFactoryService {
  private readonly calculators: Map<MissionType, IMissionProgressCalculator>;

  constructor(
    private readonly photoCalculator: PhotoMissionCalculator,
    private readonly eventCalculator: EventMissionCalculator,
    private readonly manualCalculator: ManualMissionCalculator,
  ) {
    this.calculators = new Map([
      [MissionType.AUTO_PHOTO, this.photoCalculator],
      [MissionType.AUTO_JOIN, this.eventCalculator],
      [MissionType.MANUAL, this.manualCalculator],
    ]);
  }

  /**
   * Get the appropriate calculator for a mission type
   */
  getCalculator(type: MissionType): IMissionProgressCalculator {
    const calculator = this.calculators.get(type);
    if (!calculator) {
      // Fallback to manual calculator for unknown types
      return this.manualCalculator;
    }
    return calculator;
  }

  /**
   * Get all registered calculators
   */
  getAllCalculators(): IMissionProgressCalculator[] {
    return Array.from(this.calculators.values());
  }
}
