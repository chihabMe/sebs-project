import { api as client } from './client';
import { ApiResponse, BookingStatusUpdateInput, EventFormUpdateInput } from '@sebs/shared';

export const getEventAttendees = async (eventId: string) => {
  const response = await client.get<ApiResponse>(`/organizer/event/${eventId}/attendees`);
  return response.data.data;
};

export const updateBookingStatus = async (bookingId: string, data: BookingStatusUpdateInput) => {
  const response = await client.patch<ApiResponse>(`/organizer/booking/${bookingId}/status`, data);
  return response.data;
};

export const removeAttendee = async (bookingId: string) => {
  const response = await client.delete<ApiResponse>(`/organizer/booking/${bookingId}`);
  return response.data;
};

export const generateInviteLink = async (eventId: string) => {
  const response = await client.post<ApiResponse>(`/organizer/event/${eventId}/invite-link`);
  return response.data.data;
};

export const getEventForm = async (eventId: string) => {
  const response = await client.get<ApiResponse>(`/event-forms/${eventId}`);
  return response.data.data;
};

export const updateEventForm = async (eventId: string, data: EventFormUpdateInput) => {
  const response = await client.put<ApiResponse>(`/event-forms/${eventId}`, data);
  return response.data;
};
