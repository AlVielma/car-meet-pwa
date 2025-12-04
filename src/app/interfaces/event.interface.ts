export interface EventPhoto {
  id: number;
  url: string;
  caption?: string;
  isMain: boolean;
}

export interface Organizer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  photos: {
    id: number;
    url: string;
    isMain: boolean;
  }[];
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  location: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  organizer: Organizer;
  photos: EventPhoto[];
  _count?: {
    participants: number;
  };
}

export interface PaginatedEventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Participation {
  id: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  joinedAt: string;
  event: Event;
  car: any;
}
