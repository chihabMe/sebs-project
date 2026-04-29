import { api } from './client';
import { ApiResponse, EventDto, EventStatus } from '@sebs/shared';

export interface EventQueryParams {
  search?: string;
  category?: string;
  date?: string;
}

export interface OrganizerEventFilters {
  search?: string;
  status?: EventStatus | 'ALL';
  approval?: 'ALL' | 'APPROVED' | 'PENDING';
  category?: string;
  sortBy?: 'date' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export const getEvents = async (params?: EventQueryParams) => {
  const response = await api.get<ApiResponse<EventDto[]>>('/events', { params });
  return response.data.data;
};

export const getEvent = async (id: string) => {
  const response = await api.get<ApiResponse<EventDto>>(`/events/${id}`);
  return response.data.data;
};

export const getManageEvent = async (id: string) => {
  const response = await api.get<ApiResponse<EventDto>>(`/events/${id}/manage`);
  return response.data.data;
};

export const getMyEvents = async () => {
  const response = await api.get<ApiResponse<EventDto[]>>('/events/organizer');
  return response.data.data;
};

export const createEvent = async (formData: FormData) => {
  const response = await api.post<ApiResponse<EventDto>>('/events', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateEvent = async (id: string, formData: FormData) => {
  const response = await api.patch<ApiResponse<EventDto>>(`/events/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteEvent = async (id: string) => {
  const response = await api.delete<ApiResponse<null>>(`/events/${id}`);
  return response.data;
};

export const updateEventStatus = async (id: string, status: EventStatus) => {
  const response = await api.patch<ApiResponse<EventDto>>(`/events/${id}/status`, { status });
  return response.data;
};

export const getRecommendedEvents = async () => {
  const response = await api.get<ApiResponse<EventDto[]>>('/events/recommended');
  return response.data.data;
};
