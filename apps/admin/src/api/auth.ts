import type { AdminLoginInput, AdminSessionResponse, ApiResponse, AuthResponse, UserDto } from '@sebs/shared';
import { api } from './client';

export async function loginAdmin(payload: AdminLoginInput) {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/admin/login', payload);
  return response.data.data;
}

export async function getAdminSession() {
  const response = await api.get<ApiResponse<AdminSessionResponse>>('/auth/admin/session');
  return response.data.data;
}

export async function getSession() {
  const response = await api.get<ApiResponse<UserDto>>('/auth/session');
  return response.data.data;
}

export async function logoutAdmin() {
  const response = await api.post<ApiResponse>('/auth/logout');
  return response.data;
}
