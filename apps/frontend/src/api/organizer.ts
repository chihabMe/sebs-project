import { api as client } from './client';
import {
  ApiResponse,
  BookingStatus,
  BookingStatusUpdateInput,
  EventFormUpdateInput,
} from '@sebs/shared';

export interface EventAttendeesQueryParams {
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  search?: string;
  page?: number;
  limit?: number;
}

export interface AttendeeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface AttendeeAnswer {
  id: string;
  answer: string;
  question: {
    id: string;
    question: string;
    required: boolean;
  };
}

export interface EventAttendeeBooking {
  id: string;
  status: BookingStatus;
  attended?: boolean;
  createdAt: string;
  user: AttendeeUser;
  answers: AttendeeAnswer[];
}

export interface OrganizerDashboardStats {
  totalEvents: number;
  approvedEvents: number;
  pendingApprovalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  rejectedBookings: number;
  cancelledBookings: number;
  totalCapacity: number;
  activeDemand: number;
  confirmationRate: number;
}

export interface OrganizerAttendeesResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    pending: number;
    confirmed: number;
    rejected: number;
    cancelled: number;
    attended: number;
  };
}

export const getEventAttendees = async (eventId: string, params?: EventAttendeesQueryParams) => {
  const response = await client.get<ApiResponse<OrganizerAttendeesResponse<EventAttendeeBooking>>>(
    `/organizer/events/${eventId}/attendees`,
    { params },
  );
  return response.data.data;
};

export const updateBookingStatus = async (bookingId: string, data: BookingStatusUpdateInput) => {
  const response = await client.patch<ApiResponse>(`/organizer/bookings/${bookingId}/status`, data);
  return response.data;
};

export const bulkUpdateBookingStatus = async (
  eventId: string,
  bookingIds: string[],
  status: BookingStatus,
) => {
  const response = await client.patch<ApiResponse<{ updatedCount: number }>>(
    `/organizer/events/${eventId}/bookings/status`,
    { bookingIds, status },
  );
  return response.data;
};

export const removeAttendee = async (bookingId: string) => {
  const response = await client.delete<ApiResponse>(`/organizer/bookings/${bookingId}`);
  return response.data;
};

export const bulkRemoveAttendees = async (eventId: string, bookingIds: string[]) => {
  const response = await client.post<ApiResponse<{ removedCount: number }>>(
    `/organizer/events/${eventId}/bookings/remove`,
    { bookingIds },
  );
  return response.data;
};

export const generateInviteLink = async (eventId: string) => {
  const response = await client.post<ApiResponse>(`/organizer/events/${eventId}/invite`);
  return response.data.data;
};

export const rotateInviteLink = async (eventId: string) => {
  const response = await client.post<ApiResponse<{ token: string }>>(`/organizer/events/${eventId}/invite/rotate`);
  return response.data.data;
};

export const getOrganizerDashboardStats = async () => {
  const response = await client.get<ApiResponse<OrganizerDashboardStats>>('/organizer/dashboard/stats');
  return response.data.data;
};

export const getEventForm = async (eventId: string) => {
  const response = await client.get<ApiResponse>(`/event-forms/${eventId}`);
  return response.data.data;
};

export const updateEventForm = async (eventId: string, data: EventFormUpdateInput) => {
  const response = await client.post<ApiResponse>(`/event-forms/${eventId}`, data);
  return response.data;
};
