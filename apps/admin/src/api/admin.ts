import type {
  AdminPendingEventItem,
  AdminPendingEventsQueryParams,
  AdminStats,
  AdminUserListItem,
  AdminUsersQueryParams,
  ApiResponse,
  CreateAdminUserInput,
  UpdateAdminUserInput,
} from '@sebs/shared';
import { api } from './client';

export async function getAdminUsers(params?: AdminUsersQueryParams) {
  const response = await api.get<ApiResponse<AdminUserListItem[]>>('/admin/users', { params });
  return response.data.data ?? [];
}

export async function createAdminUser(payload: CreateAdminUserInput) {
  const response = await api.post<ApiResponse<AdminUserListItem>>('/admin/users', payload);
  return response.data.data;
}

export async function updateAdminUser(id: string, payload: UpdateAdminUserInput) {
  const response = await api.patch<ApiResponse<AdminUserListItem>>(`/admin/users/${id}`, payload);
  return response.data.data;
}

export async function getPendingEvents(params?: AdminPendingEventsQueryParams) {
  const response = await api.get<ApiResponse<AdminPendingEventItem[]>>('/admin/pending-events', { params });
  return response.data.data ?? [];
}

export async function approveEvent(id: string) {
  const response = await api.patch<ApiResponse>(`/admin/approve-event/${id}`);
  return response.data;
}

export async function rejectEvent(id: string) {
  const response = await api.patch<ApiResponse>(`/admin/reject-event/${id}`);
  return response.data;
}

export async function getAdminStats() {
  const response = await api.get<ApiResponse<AdminStats>>('/admin/stats');
  return response.data.data;
}
