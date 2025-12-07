import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('events/export')
  async exportEvents(@Res() res: Response) {
    return this.dashboardService.exportEventsToExcel(res);
  }
}
