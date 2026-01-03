import { MissionType } from '@prisma/client';

/**
 * Rank information interface
 */
export interface RankInfo {
  name: string;
  minExp: number;
  maxExp: number;
  image: string;
}

/**
 * Rank configuration - extracted for maintainability
 */
export const RANKS: RankInfo[] = [
  { name: 'Rookie', minExp: 0, maxExp: 99, image: '/images/ranks/rookie.svg' },
  { name: 'Intermediate', minExp: 100, maxExp: 299, image: '/images/ranks/intermediate.svg' },
  { name: 'Master', minExp: 300, maxExp: 599, image: '/images/ranks/master.svg' },
  { name: 'Grand Master', minExp: 600, maxExp: Infinity, image: '/images/ranks/grand-master.svg' },
];

/**
 * Photo mission milestones
 */
export const PHOTO_MILESTONES = [
  { keyword: '5 รูป', required: 5 },
  { keyword: '10 รูป', required: 10 },
  { keyword: '15 รูป', required: 15 },
  { keyword: '30 รูป', required: 30 },
  { keyword: '50 รูป', required: 50 },
];

/**
 * Event/Join mission milestones
 */
export const EVENT_MILESTONES = [
  { keyword: '1 ครั้ง', required: 1 },
  { keyword: '3 ครั้ง', required: 3 },
  { keyword: '5 ครั้ง', required: 5 },
  { keyword: '10 ครั้ง', required: 10 },
];

/**
 * Extract required count from mission description
 */
export function extractRequired(description: string): number {
  const match = description.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}
