import axios, { AxiosError } from 'axios';
import { ApiResponse, GenerateRequest, IcfesItem } from '@/types/icfes';

// Configurable base URL via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for AI generation (puede tardar bastante)
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

export interface GenerateItemsOptions {
  signal?: AbortSignal;
}

export interface RequestStatusResult {
  success: boolean;
  status: string;
  progress?: number;
  requestId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface CancelRequestResult {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export async function generateItems(
  request: GenerateRequest,
  options: GenerateItemsOptions = {}
): Promise<GenerateItemsResult> {
  const maxRetries = 2;
  let lastError: AxiosError<ApiResponse<IcfesItem>> | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📤 Intento ${attempt}/${maxRetries} - Enviando request a API:`, request);
      const response = await apiClient.post<ApiResponse<IcfesItem>>(
        '/api/items/generate',
        request,
        { signal: options.signal }
      );

      const data = response.data;
      console.log('📥 Respuesta del API:', data);

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
      lastError = error as AxiosError<ApiResponse<IcfesItem>>;
      
      // Si es un error de respuesta del servidor (4xx, 5xx), no reintentar
      if (lastError.response?.data) {
        console.error('❌ Error del servidor:', lastError.response.data);
        return {
          success: false,
          items: [],
          error: lastError.response.data.error || {
            code: 'API_ERROR',
            message: lastError.message,
          },
        };
      }

      // Si es timeout o error de conexión, reintentar (excepto en el último intento)
      if (attempt < maxRetries) {
        console.warn(
          `⚠️ Timeout o error de conexión en intento ${attempt}. Reintentando en 3 segundos...`
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
    }
  }

  // Después de agotar reintentos
  console.error('❌ No se pudo conectar después de', maxRetries, 'intentos');
  return {
    success: false,
    items: [],
    error: {
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor después de varios intentos. Intenta más tarde.',
    },
  };
}

export async function getRequestStatus(
  requestId: string,
  options: GenerateItemsOptions = {}
): Promise<RequestStatusResult> {
  try {
    const response = await apiClient.get(`/api/items/requests/${requestId}/status`, {
      signal: options.signal,
    });
    const data = response.data as {
      ok?: boolean;
      status?: string;
      progress?: number;
      meta?: {
        requestId?: string;
        status?: string;
        progress?: number;
      };
      error?: {
        code: string;
        message: string;
      };
    };

    const status = data.status || data.meta?.status || 'unknown';
    const progress =
      typeof data.progress === 'number'
        ? data.progress
        : typeof data.meta?.progress === 'number'
          ? data.meta?.progress
          : undefined;

    if (data.ok === false) {
      return {
        success: false,
        status,
        progress,
        requestId: data.meta?.requestId,
        error: data.error || { code: 'STATUS_ERROR', message: 'Error al consultar estado' },
      };
    }

    return {
      success: true,
      status,
      progress,
      requestId: data.meta?.requestId || requestId,
    };
  } catch (error) {
    const lastError = error as AxiosError;
    return {
      success: false,
      status: 'unknown',
      error: {
        code: 'STATUS_ERROR',
        message: lastError.message || 'Error al consultar estado',
      },
    };
  }
}

export async function getRequestItems(
  requestId: string,
  options: GenerateItemsOptions = {}
): Promise<GenerateItemsResult> {
  try {
    const response = await apiClient.get<ApiResponse<IcfesItem>>(`/api/items/requests/${requestId}`, {
      signal: options.signal,
    });

    const data = response.data;

    if (!data.ok || !data.items) {
      return {
        success: false,
        items: [],
        requestId: data.meta?.requestId || requestId,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'Error inesperado' },
      };
    }

    return {
      success: true,
      items: data.items,
      requestId: data.meta?.requestId || requestId,
    };
  } catch (error) {
    const lastError = error as AxiosError<ApiResponse<IcfesItem>>;
    return {
      success: false,
      items: [],
      error: lastError.response?.data?.error || {
        code: 'REQUEST_ERROR',
        message: lastError.message || 'No se pudo obtener el request',
      },
    };
  }
}

export async function cancelRequest(
  requestId: string,
  options: GenerateItemsOptions = {}
): Promise<CancelRequestResult> {
  try {
    const response = await apiClient.delete(`/api/items/requests/${requestId}/cancel`, {
      signal: options.signal,
    });
    const data = response.data as {
      ok?: boolean;
      error?: {
        code: string;
        message: string;
      };
    };

    if (data.ok === false) {
      return {
        success: false,
        error: data.error || { code: 'CANCEL_ERROR', message: 'No se pudo cancelar' },
      };
    }

    return { success: true };
  } catch (error) {
    const lastError = error as AxiosError;
    return {
      success: false,
      error: {
        code: 'CANCEL_ERROR',
        message: lastError.message || 'No se pudo cancelar',
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
