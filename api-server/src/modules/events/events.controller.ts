import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll(
    @Query('search') search?: string, 
    @Query('startDate') startDate?: string, 
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.eventsService.findAll(search, startDate, endDate, Number(page), Number(limit));
  }

  @Get('locations')
  getLocations() {
    return this.eventsService.getLocations();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Body('userId') userId: string) {
    return this.eventsService.join(id, userId);
  }

  @Delete(':id/join/:userId')
  leave(@Param('id') id: string, @Param('userId') userId: string) {
    return this.eventsService.leave(id, userId);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string, 
    @Body() body: { userId: string; role: string }
  ) {
    return this.eventsService.delete(id, body.userId, body.role);
  }
}
