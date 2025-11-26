import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: any) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.eventsService.findAll(search, startDate, endDate);
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
  update(@Param('id') id: string, @Body() updateEventDto: any) {
    return this.eventsService.update(id, updateEventDto);
  }
}
