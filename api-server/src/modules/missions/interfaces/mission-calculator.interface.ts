import { MissionType } from '@prisma/client';

/**
 * Interface for mission progress calculators (Strategy Pattern)
 * Each calculator handles progress calculation for a specific mission type
 */
export interface IMissionProgressCalculator {
  /**
   * The mission type this calculator handles
   */
  readonly type: MissionType;

  /**
   * Calculate current progress for a user
   * @param userId - The user's ID
   * @param required - The required amount to complete the mission
   * @returns Current progress count
   */
  calculate(userId: string, required: number): Promise<number>;

  /**
   * Check if a mission should be auto-completed
   * @param userId - The user's ID
   * @param required - The required amount
   * @returns true if mission should be completed
   */
  shouldComplete(userId: string, required: number): Promise<boolean>;
}
