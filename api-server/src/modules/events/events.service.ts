import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EventsService {
  private prisma = new PrismaClient();

  create(data: any) {
    return this.prisma.event.create({ data });
  }

  findAll() {
    return this.prisma.event.findMany();
  }
}
