import { api } from './client';
import { ApiResponse } from '@sebs/shared';

export interface CreateReviewData {
  eventId: string;
  rating: number;
  comment?: string;
}

export const getEventReviews = async (eventId: string) => {
  const response = await api.get<ApiResponse<any>>(`/reviews/event/${eventId}`);
  return response.data.data;
};

export const createReview = async (data: CreateReviewData) => {
  const response = await api.post<ApiResponse<any>>('/reviews', data);
  return response.data;
};

export const deleteReview = async (id: string) => {
  const response = await api.delete<ApiResponse<any>>(`/reviews/${id}`);
  return response.data;
};
