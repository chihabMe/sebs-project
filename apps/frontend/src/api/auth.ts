import { api } from './client';
import { ApiResponse, FollowNotificationDto, PaginationMeta, UserDto, UserSearchResultDto } from '@sebs/shared';
import type { ChangePasswordInput } from '@sebs/shared';
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
    const response = await api.patch<ApiResponse<UserDto>>('/users/profile', data);
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

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  token: string;
  password: string;
};

export const forgotPassword = async (data: ForgotPasswordPayload) => {
  try {
    const response = await api.post<ApiResponse>('/auth/forgot-password', data);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const resetPassword = async (data: ResetPasswordPayload) => {
  try {
    const response = await api.post<ApiResponse>('/auth/reset-password', data);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const changePassword = async (data: ChangePasswordInput) => {
  try {
    const response = await api.post<ApiResponse>('/auth/change-password', data);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const deleteProfile = async (password: string) => {
  try {
    const response = await api.delete<ApiResponse>('/users/profile', { data: { password } });
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const searchUsers = async (query: string, page = 1, limit = 12) => {
  try {
    const response = await api.get<ApiResponse<UserSearchResultDto[]> & { meta?: PaginationMeta }>('/users/search', { params: { query, page, limit } });
    return {
      data: response.data.data || [],
      meta: response.data.meta,
    };
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const followUser = async (userId: string) => {
  try {
    const response = await api.post<ApiResponse>(`/users/${userId}/follow`);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const unfollowUser = async (userId: string) => {
  try {
    const response = await api.delete<ApiResponse>(`/users/${userId}/follow`);
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const updateFollowBookingNotifications = async (notifyFollowersOnBooking: boolean) => {
  try {
    const response = await api.patch<ApiResponse>('/users/settings/notify-followers-bookings', { notifyFollowersOnBooking });
    return response.data;
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const getNotifications = async () => {
  try {
    const response = await api.get<ApiResponse<FollowNotificationDto[]>>('/users/notifications');
    return response.data.data || [];
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};

export const getFollowing = async (page = 1, limit = 10) => {
  try {
    const response = await api.get<ApiResponse<UserSearchResultDto[]> & { meta?: PaginationMeta }>('/users/following', { params: { page, limit } });
    return {
      data: response.data.data || [],
      meta: response.data.meta,
    };
  } catch (error) {
    const apiError = handleApiError(error);
    throw new Error(apiError.message);
  }
};
