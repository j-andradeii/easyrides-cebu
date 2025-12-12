/**
 * Example Service
 *
 * Feature-specific API service
 * Uses the base API client for HTTP requests
 */

import { apiClient } from '@/services/api-client';

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
  async getAll(): Promise<ExampleItem[]> {
    const response = await apiClient.get(this.basePath);
    return response.json();
  }

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<ExampleItem> {
    const response = await apiClient.get(`${this.basePath}/${id}`);
    return response.json();
  }

  /**
   * Create new item
   */
  async create(data: CreateExampleDto): Promise<ExampleItem> {
    const response = await apiClient.post(this.basePath, data);
    return response.json();
  }

  /**
   * Update item
   */
  async update(id: string, data: UpdateExampleDto): Promise<ExampleItem> {
    const response = await apiClient.patch(`${this.basePath}/${id}`, data);
    return response.json();
  }

  /**
   * Delete item
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }
}

export const exampleService = new ExampleService();
