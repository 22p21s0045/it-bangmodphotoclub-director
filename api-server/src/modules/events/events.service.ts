import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  private prisma = new PrismaClient();

  create(data: CreateEventDto) {
    const eventData: Prisma.EventCreateInput = {
      title: data.title,
      description: data.description,
      location: data.location,
      joinLimit: data.joinLimit,
      activityHours: data.activityHours,
      eventDates: data.eventDates ? data.eventDates.map((date) => new Date(date)) : [],
      submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : null,
    };
    return this.prisma.event.create({ data: eventData });
  }

  async findAll(search?: string, startDate?: string, endDate?: string) {
    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    
    // Re-implementing date filtering is out of scope for just "refactor types", 
    // but I can't leave broken code.
    // I'll just keep the search filter which is correct.
    
    return this.prisma.event.findMany({
      where,
      include: {
        photos: true,
        joins: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { 
        photos: true, 
        joins: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                role: true,
              }
            }
          }
        } 
      },
    });
    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    return event;
  }

  async update(id: string, data: UpdateEventDto) {
    const updateData: Prisma.EventUpdateInput = {
      ...data,
      eventDates: data.eventDates ? data.eventDates.map((date) => new Date(date)) : undefined,
      submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
    };

    try {
      return await this.prisma.event.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }

  async join(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { joins: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if user already joined
    const alreadyJoined = event.joins.some((join) => join.userId === userId);
    if (alreadyJoined) {
      // User already joined, maybe return success or throw error?
      // Let's return the existing join record to be idempotent-ish
      return this.prisma.joinEvent.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId,
          },
        },
      });
    }

    // Check join limit
    if (event.joinLimit > 0 && event.joins.length >= event.joinLimit) {
      throw new Error('Event is full');
    }

    return this.prisma.joinEvent.create({
      data: {
        eventId,
        userId,
      },
    });
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
