import axios, { AxiosError } from 'axios';
import { ApiResponse, GenerateRequest, IcfesItem } from '@/types/icfes';

// Configurable base URL via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for AI generation
});

export interface GenerateItemsResult {
  success: boolean;
  items: IcfesItem[];
  requestId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export async function generateItems(request: GenerateRequest): Promise<GenerateItemsResult> {
  try {
    const response = await apiClient.post<ApiResponse<IcfesItem>>(
      '/api/items/generate',
      request
    );

    const data = response.data;

    if (!data.ok || !data.items) {
      return {
        success: false,
        items: [],
        requestId: data.meta?.requestId,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'Error inesperado' },
      };
    }

    return {
      success: true,
      items: data.items,
      requestId: data.meta?.requestId,
    };
  } catch (error) {
    const axiosError = error as AxiosError<ApiResponse<IcfesItem>>;
    
    if (axiosError.response?.data) {
      return {
        success: false,
        items: [],
        error: axiosError.response.data.error || {
          code: 'API_ERROR',
          message: axiosError.message,
        },
      };
    }

    // Network error or timeout
    return {
      success: false,
      items: [],
      error: {
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión.',
      },
    };
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/api/health');
    return response.status === 200;
  } catch {
    return false;
  }
}
