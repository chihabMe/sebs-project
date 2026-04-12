import { api } from './client';
import { ApiResponse, UserDto } from '@sebs/shared';

export const getProfile = async () => {
  const response = await api.get<ApiResponse<UserDto>>('/users/profile');
  return response.data.data;
};

export const getAttendanceHistory = async () => {
  const response = await api.get<ApiResponse<any[]>>('/users/attendance');
  return response.data.data;
};

export const updateProfile = async (data: any) => {
  const response = await api.put<ApiResponse<UserDto>>('/users/profile', data);
  return response.data;
};

export const logout = async () => {
  const response = await api.post<ApiResponse>('/auth/logout');
  return response.data;
};
