export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'USER' | 'ADMIN';
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  userId: string;
  eventId: string;
}
