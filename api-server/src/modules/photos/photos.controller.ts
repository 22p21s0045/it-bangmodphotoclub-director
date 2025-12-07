import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post('upload-url')
  async getUploadUrl(@Body() body: { filename: string; eventId: string; userId: string }) {
    return this.photosService.generatePresignedUrl(body.filename, body.eventId, body.userId);
  }

  @Post()
  async create(@Body() createPhotoDto: CreatePhotoDto) {
    return this.photosService.create(createPhotoDto);
  }

  @Get()
  async findAll() {
    return this.photosService.findAll();
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Body() body: { userId: string; role: string }
  ) {
    return this.photosService.delete(id, body.userId, body.role);
  }
}
