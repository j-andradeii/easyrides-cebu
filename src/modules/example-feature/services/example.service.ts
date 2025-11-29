/**
 * Example Service
 *
 * Feature-specific API service
 * Uses the base API client for HTTP requests
 */

import { apiClient, ApiResponse } from '@/services/api-client';

interface ExampleItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateExampleDto {
  title: string;
  description: string;
}

interface UpdateExampleDto {
  title?: string;
  description?: string;
}

class ExampleService {
  private readonly basePath = '/examples';

  /**
   * Get all items
   */
  async getAll(): Promise<ApiResponse<ExampleItem[]>> {
    return apiClient.get<ExampleItem[]>(this.basePath);
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<ApiResponse<ExampleItem>> {
    return apiClient.get<ExampleItem>(`${this.basePath}/${id}`);
  }

  /**
   * Create new item
   */
  async create(data: CreateExampleDto): Promise<ApiResponse<ExampleItem>> {
    return apiClient.post<ExampleItem>(this.basePath, data);
  }

  /**
   * Update item
   */
  async update(
    id: string,
    data: UpdateExampleDto
  ): Promise<ApiResponse<ExampleItem>> {
    return apiClient.patch<ExampleItem>(`${this.basePath}/${id}`, data);
  }

  /**
   * Delete item
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

export const exampleService = new ExampleService();
