import { api as client } from './client';
import { ApiResponse } from '@sebs/shared';

export const getAdminUsers = async () => {
  const response = await client.get<ApiResponse>('/admin/users');
  return response.data.data;
};

export const createAdminUser = async (data: any) => {
  const response = await client.post<ApiResponse>('/admin/users', data);
  return response.data;
};

export const updateAdminUserStatus = async (id: string, data: { isBanned?: boolean; role?: string }) => {
  const response = await client.patch<ApiResponse>(`/admin/users/${id}`, data);
  return response.data;
};

export const getAdminPendingEvents = async () => {
  const response = await client.get<ApiResponse>('/admin/events/pending');
  return response.data.data;
};

export const approveAdminEvent = async (id: string) => {
  const response = await client.patch<ApiResponse>(`/admin/events/${id}/approve`);
  return response.data;
};

export const getAdminStats = async () => {
  const response = await client.get<ApiResponse>('/admin/stats');
  return response.data.data;
};
