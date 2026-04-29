import { api } from './client';
import { ApiResponse } from '@sebs/shared';

export const getMyBookings = async () => {
  const response = await api.get<ApiResponse<any[]>>('/bookings/my');
  return response.data.data;
};

export const cancelBooking = async (id: string) => {
  const response = await api.patch<ApiResponse<any>>(`/bookings/${id}/cancel`);
  return response.data;
};

export const downloadTicket = async (id: string) => {
  try {
    const response = await api.get<ApiResponse<{ url: string }>>(`/bookings/${id}/ticket`);
    const ticketPath = response.data.data?.url;
    if (!ticketPath) {
      throw new Error('Ticket URL not found');
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    const ticketUrl = ticketPath.startsWith('http')
      ? ticketPath
      : `${baseUrl}${ticketPath.startsWith('/') ? '' : '/'}${ticketPath}`;

    const fileResponse = await fetch(ticketUrl, { credentials: 'include' });
    if (!fileResponse.ok) {
      throw new Error('Failed to fetch ticket file');
    }

    const blob = await fileResponse.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ticket-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download ticket. Please try again.');
  }
};

export const createBooking = async (eventId: string, answers?: any[], token?: string) => {
  const response = await api.post<ApiResponse<any>>('/bookings', { eventId, answers }, {
    params: token ? { token } : undefined,
  });
  return response.data;
};

export const checkBookingStatus = async (eventId: string) => {
  const response = await api.get<ApiResponse<any>>(`/bookings/status/${eventId}`);
  return response.data.data;
};

export const checkIn = async (eventId: string) => {
  const response = await api.post<ApiResponse<any>>(`/bookings/checkin/${eventId}`);
  return response.data;
};
