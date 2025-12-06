import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma, EventStatus } from '@prisma/client';
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
      status: EventStatus.UPCOMING,
    };
    return this.prisma.event.create({ data: eventData });
  }

  async findAll(search?: string, startDate?: string, endDate?: string, page: number = 1, limit: number = 10) {
    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination metadata
    const total = await this.prisma.event.count({ where });

    const data = await this.prisma.event.findMany({
      where,
      include: {
        photos: true,
        joins: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
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

    // Check if event date has passed and status is UPCOMING
    if (event.status === EventStatus.UPCOMING && event.eventDates.length > 0) {
      const now = new Date();
      // Check if any event date is in the past (or today)
      // Using the earliest date to determine if the event has "started" or "arrived"
      // If the requirement is "when the event date arrives", we can check if now >= startDate
      
      // Sort dates to find the earliest one
      const sortedDates = [...event.eventDates].sort((a, b) => a.getTime() - b.getTime());
      const startDate = sortedDates[0];

      if (now >= startDate) {
        // Update status to PENDING_RAW
        const updatedEvent = await this.prisma.event.update({
          where: { id },
          data: { status: EventStatus.PENDING_RAW },
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
        return updatedEvent;
      }
    }

    return event;
  }

  async update(id: string, data: UpdateEventDto) {
    const updateData: Prisma.EventUpdateInput = {
      ...data,
      eventDates: data.eventDates ? data.eventDates.map((date) => new Date(date)) : undefined,
      submissionDeadline: data.submissionDeadline ? new Date(data.submissionDeadline) : undefined,
      status: data.status,
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
      throw new BadRequestException('กิจกรรมนี้มีผู้เข้าร่วมครบจำนวนแล้ว');
    }

    const join = await this.prisma.joinEvent.create({
      data: {
        eventId,
        userId,
      },
    });

    // Check if limit reached after join or if it's an unlimited event with at least one participant
    const currentParticipants = event.joins.length + 1;
    const isLimitReached = event.joinLimit > 0 && currentParticipants >= event.joinLimit;
    const isUnlimitedAndActive = event.joinLimit === 0 && currentParticipants >= 1;

    if (isLimitReached || isUnlimitedAndActive) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.PENDING_RAW },
      });
    }

    return join;
  }

  async leave(eventId: string, userId: string) {
    const joinRecord = await this.prisma.joinEvent.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (!joinRecord) {
      throw new NotFoundException('User is not joined to this event');
    }

    return this.prisma.joinEvent.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
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
