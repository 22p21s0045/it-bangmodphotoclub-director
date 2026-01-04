import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { AlbumsService } from './albums.service';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  create(@Body() body: { title: string; description?: string; isPublic?: boolean }) {
    return this.albumsService.create(body);
  }

  @Get()
  findAll() {
    return this.albumsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.albumsService.findOne(id);
  }

  @Patch(':id/photos')
  addPhotos(@Param('id') id: string, @Body() body: { photoIds: string[] }) {
    return this.albumsService.addPhotos(id, body.photoIds);
  }

  @Delete(':id/photos')
  removePhotos(@Param('id') id: string, @Body() body: { photoIds: string[] }) {
    return this.albumsService.removePhotos(id, body.photoIds);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.albumsService.delete(id);
  }
}
