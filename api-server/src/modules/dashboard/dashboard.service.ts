import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DashboardService {
  private prisma = new PrismaClient();

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Overview stats - parallel queries
    const [
      totalMembers,
      totalEvents,
      eventsThisMonth,
      totalPhotos,
      completedEvents,
      photoStats,
      topParticipants,
      topPhotographers,
      recentActivities,
    ] = await Promise.all([
      // Total active members
      this.prisma.user.count({ where: { isActive: true } }),

      // Total events
      this.prisma.event.count(),

      // Events this month
      this.prisma.event.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Total photos
      this.prisma.photo.count(),

      // Sum activity hours from completed events
      this.prisma.event.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { activityHours: true },
      }),

      // Photo stats
      this.getPhotoStats(),

      // Top 5 participants
      this.getTopParticipants(5),

      // Top 5 photographers
      this.getTopPhotographers(5),

      // Recent activities
      this.prisma.eventActivityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          event: {
            select: { id: true, title: true },
          },
        },
      }),
    ]);

    return {
      overview: {
        totalMembers,
        totalEvents,
        eventsThisMonth,
        totalPhotos,
        totalActivityHours: completedEvents._sum.activityHours || 0,
      },
      photoStats,
      topParticipants,
      topPhotographers,
      recentActivities,
    };
  }

  private async getPhotoStats() {
    const [rawPhotos, editedPhotos, storageResult, eventsWithEdited, totalEvents] = await Promise.all([
      this.prisma.photo.count({ where: { type: 'RAW' } }),
      this.prisma.photo.count({ where: { type: 'EDITED' } }),
      this.prisma.photo.aggregate({ _sum: { size: true } }),
      this.prisma.event.count({
        where: {
          photos: {
            some: { type: 'EDITED' },
          },
        },
      }),
      this.prisma.event.count(),
    ]);

    return {
      rawPhotos,
      editedPhotos,
      totalStorageBytes: storageResult._sum.size || 0,
      eventsWithEditedPhotos: eventsWithEdited,
      totalEvents,
    };
  }

  private async getTopParticipants(limit: number) {
    const participants = await this.prisma.joinEvent.groupBy({
      by: ['userId'],
      _count: { eventId: true },
      orderBy: { _count: { eventId: 'desc' } },
      take: limit,
    });

    const userIds = participants.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, email: true },
    });

    return participants.map((p) => ({
      user: users.find((u) => u.id === p.userId),
      eventCount: p._count.eventId,
    }));
  }

  private async getTopPhotographers(limit: number) {
    const photographers = await this.prisma.photo.groupBy({
      by: ['userId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    const userIds = photographers.map((p) => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true, email: true },
    });

    return photographers.map((p) => ({
      user: users.find((u) => u.id === p.userId),
      photoCount: p._count.id,
    }));
  }
}
