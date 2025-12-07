export class CreatePhotoDto {
  eventId: string;
  filename: string;
  userId: string;
  url: string;
  path?: string; // Relative path for MinIO operations
}
