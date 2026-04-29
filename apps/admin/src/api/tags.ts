import type { ApiResponse, TagCreateInput, TagDto } from '@sebs/shared';
import { api } from './client';

export async function getTags() {
  const response = await api.get<ApiResponse<TagDto[]>>('/tags');
  return response.data.data ?? [];
}

export async function createTag(payload: TagCreateInput) {
  const response = await api.post<ApiResponse<TagDto>>('/tags', payload);
  return response.data.data;
}

export async function deleteTag(id: string) {
  const response = await api.delete<ApiResponse>(`/tags/${id}`);
  return response.data;
}
