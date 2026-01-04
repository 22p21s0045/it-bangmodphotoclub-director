/**
 * Shared TypeScript types for the application
 * Based on Prisma schema definitions
 */

// ============ Enums ============

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum EventStatus {
  UPCOMING = "UPCOMING",
  PENDING_RAW = "PENDING_RAW",
  PENDING_EDIT = "PENDING_EDIT",
  COMPLETED = "COMPLETED",
}

// ============ User Types ============

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: Role | string;
  studentId?: string | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UpdateUserDto {
  name?: string;
  avatar?: string;
  password?: string;
  studentId?: string;
}

// ============ Event Types ============

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  eventDates: string[] | Date[];
  location?: string | null;
  coverImage?: string | null;
  joinLimit: number;
  activityHours: number;
  submissionDeadline?: string | Date | null;
  status: EventStatus | string;
  createdAt: string | Date;
  updatedAt: string | Date;
  joins?: JoinEvent[];
  photos?: Photo[];
}

export interface CreateEventDto {
  title: string;
  description?: string;
  location?: string;
  eventDates?: string[];
  joinLimit?: number;
  activityHours?: number;
  submissionDeadline?: string;
  status?: EventStatus;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {}

// ============ JoinEvent Types ============

export interface JoinEvent {
  id: string;
  userId: string;
  eventId: string;
  joinedAt: string | Date;
  user?: User;
  event?: Event;
}

// ============ Photo Types ============

export enum PhotoType {
  RAW = "RAW",
  EDITED = "EDITED",
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  metadata?: Record<string, unknown> | null;
  type?: PhotoType | string;
  isApproved: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
  eventId: string;
  user?: User;
  event?: Event;
}

// ============ API Response Types ============

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============ Image Cropper Types ============

export interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedAreaPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============ Activity Log Types ============

export enum EventAction {
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT",
  PHOTO_UPLOADED = "PHOTO_UPLOADED",
  PHOTO_DELETED = "PHOTO_DELETED",
  STATUS_CHANGED = "STATUS_CHANGED",
  EVENT_UPDATED = "EVENT_UPDATED",
}

export interface EventActivityLog {
  id: string;
  eventId: string;
  userId?: string | null;
  action: EventAction | string;
  details?: Record<string, unknown> | null;
  createdAt: string | Date;
  user?: Pick<User, 'id' | 'name' | 'avatar'> | null;
}

// ============ Album Types ============

export interface Album {
  id: string;
  title: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  photos?: Photo[];
}
