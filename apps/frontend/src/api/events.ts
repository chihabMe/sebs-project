import { api } from './client';
import { ApiResponse } from '@sebs/shared';

export interface EventQueryParams {
  search?: string;
  category?: string;
  date?: string;
}

export const getEvents = async (params?: EventQueryParams) => {
  const response = await api.get<ApiResponse<any[]>>('/events', { params });
  return response.data.data;
};

export const getEvent = async (id: string) => {
  const response = await api.get<ApiResponse<any>>(`/events/${id}`);
  return response.data.data;
};

export const getMyEvents = async () => {
  const response = await api.get<ApiResponse<any[]>>('/events/my/events');
  return response.data.data;
};

export const createEvent = async (formData: FormData) => {
  const response = await api.post<ApiResponse<any>>('/events', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateEvent = async (id: string, formData: FormData) => {
  const response = await api.put<ApiResponse<any>>(`/events/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteEvent = async (id: string) => {
  const response = await api.delete<ApiResponse<any>>(`/events/${id}`);
  return response.data;
};

export const getEventAttendees = async (eventId: string) => {
  const response = await api.get<ApiResponse<any[]>>(`/bookings/event/${eventId}`);
  return response.data.data;
};
