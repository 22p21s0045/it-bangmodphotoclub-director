export class CreatePhotoDto {
  eventId: string;
  filename: string;
  userId: string;
  url: string;
  path?: string; // Relative path for MinIO operations
  type?: 'RAW' | 'EDITED'; // Photo type, defaults to RAW
}
