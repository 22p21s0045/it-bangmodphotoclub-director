import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

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
      monthlyEvents,
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

      // Monthly events for chart
      this.getMonthlyEvents(6),
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
      monthlyEvents,
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

  private async getMonthlyEvents(months: number) {
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const count = await this.prisma.event.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      result.push({
        month: monthNames[startDate.getMonth()],
        events: count,
      });
    }

    return result;
  }

  async exportEventsToExcel(res: Response) {
    const events = await this.prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { joins: true },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายการกิจกรรม');

    // Header styling
    worksheet.columns = [
      { header: 'ลำดับ', key: 'no', width: 8 },
      { header: 'ชื่อกิจกรรม', key: 'title', width: 40 },
      { header: 'สถานะ', key: 'status', width: 15 },
      { header: 'จำนวนผู้เข้าร่วม', key: 'participants', width: 15 },
      { header: 'จำกัดผู้เข้าร่วม', key: 'limit', width: 15 },
      { header: 'วันที่จัด', key: 'dates', width: 30 },
      { header: 'สถานที่', key: 'location', width: 25 },
      { header: 'ชั่วโมงกิจกรรม', key: 'hours', width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const statusMap: Record<string, string> = {
      UPCOMING: 'เปิดรับสมัคร',
      PENDING_RAW: 'รอ RAW',
      PENDING_EDIT: 'รอแต่งรูป',
      COMPLETED: 'เสร็จสิ้น',
    };

    // Add data rows
    events.forEach((event, index) => {
      const eventDates = event.eventDates
        .map((d) => {
          const date = new Date(d);
          return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
        })
        .join(', ');

      worksheet.addRow({
        no: index + 1,
        title: event.title,
        status: statusMap[event.status] || event.status,
        participants: event._count.joins,
        limit: event.joinLimit || '-',
        dates: eventDates || '-',
        location: event.location || '-',
        hours: event.activityHours || 0,
      });
    });

    // Summary row
    worksheet.addRow({});
    worksheet.addRow({
      no: '',
      title: `รวมทั้งหมด: ${events.length} กิจกรรม`,
    });

    // Set response headers
    const fileName = `events_summary_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
