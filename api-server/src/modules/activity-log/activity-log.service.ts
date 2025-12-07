import { Injectable } from '@nestjs/common';
import { PrismaClient, EventAction } from '@prisma/client';

@Injectable()
export class ActivityLogService {
  private prisma = new PrismaClient();

  async logActivity(
    eventId: string,
    userId: string | null,
    action: EventAction,
    details?: Record<string, any>,
  ) {
    return this.prisma.eventActivityLog.create({
      data: {
        eventId,
        userId,
        action,
        details: details || null,
      },
    });
  }

  async getEventActivities(eventId: string, limit: number = 50) {
    return this.prisma.eventActivityLog.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
