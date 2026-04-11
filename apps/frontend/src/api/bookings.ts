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
    const response = await api.get(`/bookings/${id}/ticket`, {
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
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
    alert('Failed to download ticket. Please try again.');
  }
};

export const checkBookingStatus = async (eventId: string) => {
  const response = await api.get<ApiResponse<any>>(`/bookings/event/${eventId}/status`);
  return response.data.data;
};
