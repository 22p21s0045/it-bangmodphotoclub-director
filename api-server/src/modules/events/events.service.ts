import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EventsService {
  private prisma = new PrismaClient();

  create(data: any) {
    if (data.eventDates && Array.isArray(data.eventDates)) {
      data.eventDates = data.eventDates.map((date: string) => new Date(date));
    }
    if (data.joinLimit) {
      data.joinLimit = Number(data.joinLimit);
    }
    if (data.submissionDeadline) {
      data.submissionDeadline = new Date(data.submissionDeadline);
    }
    if (data.activityHours) {
      data.activityHours = Number(data.activityHours);
    }
    return this.prisma.event.create({ data });
  }

  async findAll(search?: string, startDate?: string, endDate?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter events that have at least one date in the specified range
    if (startDate || endDate) {
      where.eventDates = {
        some: {},
      };
      if (startDate) {
        where.eventDates.some.gte = new Date(startDate);
      }
      if (endDate) {
        where.eventDates.some.lte = new Date(endDate);
      }
    }

    return this.prisma.event.findMany({
      where,
      include: {
        photos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { photos: true, joins: true },
    });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    return event;
  }

  async update(id: string, data: any) {
    if (data.eventDates && Array.isArray(data.eventDates)) {
      data.eventDates = data.eventDates.map((date: string) => new Date(date));
    }
    if (data.joinLimit) {
      data.joinLimit = Number(data.joinLimit);
    }
    if (data.submissionDeadline) {
      data.submissionDeadline = new Date(data.submissionDeadline);
    }
    if (data.activityHours) {
      data.activityHours = Number(data.activityHours);
    }
    
    try {
      return await this.prisma.event.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }

  async getLocations() {
    const events = await this.prisma.event.findMany({
      where: {
        location: {
          not: null,
        },
      },
      distinct: ['location'],
      select: {
        location: true,
      },
      orderBy: {
        location: 'asc',
      },
    });
    
    return events.map(event => event.location).filter(Boolean);
  }
}
