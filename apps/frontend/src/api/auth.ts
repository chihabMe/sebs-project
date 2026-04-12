import { api } from './client';
import { ApiResponse, UserDto } from '@sebs/shared';
import { handleApiError } from '../utils/errorHandler';

export const getProfile = async () => {
  try {
    const response = await api.get<ApiResponse<UserDto>>('/users/profile');
    return response.data.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const getAttendanceHistory = async () => {
  try {
    const response = await api.get<ApiResponse<any[]>>('/users/attendance');
    return response.data.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const getPublicProfile = async (userId: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/users/public/${userId}`);
    return response.data.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const updateProfile = async (data: any) => {
  try {
    const response = await api.put<ApiResponse<UserDto>>('/users/profile', data);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const logout = async () => {
  try {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};
