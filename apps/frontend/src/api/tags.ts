import { api } from './client';
import { ApiResponse, TagDto, TagCreateInput } from '@sebs/shared';

export const getAllTags = async () => {
  const response = await api.get<ApiResponse<TagDto[]>>('/tags');
  return response.data;
};

export const createTag = async (data: TagCreateInput) => {
  const response = await api.post<ApiResponse<TagDto>>('/tags', data);
  return response.data;
};

export const deleteTag = async (id: string) => {
  const response = await api.delete<ApiResponse>(`/tags/${id}`);
  return response.data;
};
