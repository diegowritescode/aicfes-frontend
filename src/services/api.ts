import axios, { AxiosError } from 'axios';
import { ApiResponse, GenerateRequest, IcfesItem, Area, Dificultad } from '@/types/icfes';

// Configurable base URL via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL is not set. Define it in .env.local or the deployment env.');
}

export { API_BASE_URL };

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for AI generation (puede tardar bastante)
});

const AUTH_STORAGE_KEY = 'aicfes_auth_v1';

export interface AuthPayload {
  userId: string;
  email: string;
  timezone: string;
  token: string;
  tokenType: string;
  expiresIn: string;
}

export interface AuthResult {
  success: boolean;
  data?: AuthPayload;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthUser {
  userId: string;
  email: string;
  timezone: string;
}

export interface StoredAuth {
  token: string;
  user: AuthUser;
}

export interface DashboardStreak {
  currentDays: number;
  longestDays: number;
  nextMilestoneDays: number;
  lastStudyDate: string;
}

export interface DashboardLevel {
  level: number;
  totalXp: number;
  currentXp: number;
  nextLevelXp: number;
}

export interface DashboardTimeStudied {
  weekMinutes: number;
  lastSessionAt: string;
}

export interface DashboardMission {
  id: string;
  title: string;
  status: 'done' | 'pending';
  progress: number;
  target: number;
  xpReward: number;
}

export interface DashboardMissions {
  total: number;
  completed: number;
  items: DashboardMission[];
}

export interface DashboardAreaProgress {
  area: string;
  accuracy: number;
  questions: number;
}

export interface DashboardChallenge {
  title: string;
  description: string;
  xpReward: number;
}

export interface DashboardModeCard {
  status: 'active' | 'recommended';
  lastSessionAt: string;
  recommendation: string;
  sessionsThisWeek: number;
}

export interface DashboardData {
  streak: DashboardStreak;
  level: DashboardLevel;
  timeStudied: DashboardTimeStudied;
  missions: DashboardMissions;
  areaProgress: DashboardAreaProgress[];
  suggestedChallenge: DashboardChallenge;
  modeCards: {
    generacion_libre: DashboardModeCard;
    contrarreloj: DashboardModeCard;
  };
}

export interface DashboardResult {
  success: boolean;
  data?: DashboardData;
  error?: {
    code: string;
    message: string;
  };
}

export interface AnswerPayload {
  sessionId: string;
  questionIndex: number;
  selectedAnswer: string;
  isCorrect: boolean;
  area: Area;
  dificultad: Dificultad;
}

export interface StudySessionPayload {
  mode: 'generacion_libre' | 'contrarreloj' | 'test';
  area?: Area;
  dificultad?: Dificultad;
  tema?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  totalQuestions: number;
  correctQuestions: number;
}

export interface StudySessionStartPayload {
  mode: 'generacion_libre' | 'contrarreloj' | 'test';
  area?: Area;
  dificultad?: Dificultad;
  tema?: string;
  startedAt: string;
}

export interface StudySessionStartResult {
  success: boolean;
  data?: {
    sessionId: string;
    startedAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface StudySessionHeartbeatResult {
  success: boolean;
  data?: {
    id: string;
    durationSeconds: number;
    endedAt?: string;
    lastHeartbeatAt?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface StudySessionResult {
  success: boolean;
  data?: {
    sessionId: string;
    xpAwarded: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface TimeTrialMode {
  id: string;
  title: string;
  description: string;
  timeLimitSeconds: number;
  questions: number;
  area?: Area;
  dificultad?: Dificultad;
  mix?: Array<{ area: Area; dificultad: Dificultad; n: number }>;
}

export interface TimeTrialStartResult {
  success: boolean;
  data?: {
    sessionId: string;
    timeLimitSeconds: number;
    items: IcfesItem[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface FeedbackPayload {
  summary: string;
  strengths: Array<{ area: string; note: string }>;
  weaknesses: Array<{ area: string; note: string }>;
  plan: Array<{ title: string; detail: string }>;
  insights?: {
    avgTimePerQuestionSeconds?: number;
    accuracy?: number;
    speedNote?: string;
  };
  generatedAt: string;
  model: string;
  promptVersion?: string;
}

export interface FeedbackResult {
  success: boolean;
  data?: FeedbackPayload;
  error?: { code: string; message: string };
  cached?: boolean;
}

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!auth) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // ignore storage errors
  }
}

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete apiClient.defaults.headers.common.Authorization;
}

apiClient.interceptors.request.use((config) => {
  if (config.headers?.Authorization) return config;
  const stored = getStoredAuth();
  if (stored?.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${stored.token}`;
    if (stored.user?.userId) {
      config.headers['X-User-Id'] = stored.user.userId;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error?.config as { _retry?: boolean; headers?: Record<string, string>; url?: string } | undefined;
    if (
      error?.response?.status === 401 &&
      originalConfig &&
      !originalConfig._retry &&
      !originalConfig.url?.includes('/api/auth/refresh')
    ) {
      originalConfig._retry = true;
      const refreshed = await refreshAuthToken();
      if (refreshed.success && refreshed.token) {
        originalConfig.headers = originalConfig.headers || {};
        originalConfig.headers.Authorization = `Bearer ${refreshed.token}`;
        return apiClient(originalConfig);
      }
    }
    return Promise.reject(error);
  }
);

export interface GenerateItemsResult {
  success: boolean;
  items: IcfesItem[];
  requestId?: string;
  sessionId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface GenerateMixedRequest {
  sections: GenerateRequest[];
  shuffle: boolean;
  session?: {
    create: boolean;
    seedAreaSummary?: boolean;
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

export async function registerUser(params: {
  email: string;
  password: string;
  timezone: string;
}): Promise<AuthResult> {
  try {
    const response = await apiClient.post('/api/auth/register', params, { withCredentials: true });
    const data = response.data as { ok?: boolean; data?: AuthPayload; error?: { code: string; message: string } };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'REGISTER_ERROR', message: 'No se pudo registrar.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'REGISTER_ERROR',
        message: lastError.message || 'No se pudo registrar.',
      },
    };
  }
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  try {
    const response = await apiClient.post('/api/auth/login', params, { withCredentials: true });
    const data = response.data as { ok?: boolean; data?: AuthPayload; error?: { code: string; message: string } };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'LOGIN_ERROR', message: 'No se pudo iniciar sesión.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'LOGIN_ERROR',
        message: lastError.message || 'No se pudo iniciar sesión.',
      },
    };
  }
}

export async function refreshAuthToken(): Promise<{ success: boolean; token?: string }> {
  try {
    const response = await apiClient.post('/api/auth/refresh', undefined, { withCredentials: true });
    const data = response.data as { ok?: boolean; data?: { token?: string }; token?: string };
    const token = data.data?.token || data.token;
    if (!token) {
      setStoredAuth(null);
      setAuthToken(null);
      return { success: false };
    }
    const stored = getStoredAuth();
    if (stored) {
      setStoredAuth({ token, user: stored.user });
    }
    setAuthToken(token);
    return { success: true, token };
  } catch {
    setStoredAuth(null);
    setAuthToken(null);
    return { success: false };
  }
}

export async function getDashboard(): Promise<DashboardResult> {
  try {
    const response = await apiClient.get('/api/dashboard');
    const data = response.data as { ok?: boolean; data?: DashboardData; error?: { code: string; message: string } };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'DASHBOARD_ERROR', message: 'No se pudo cargar el dashboard.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'DASHBOARD_ERROR',
        message: lastError.message || 'No se pudo cargar el dashboard.',
      },
    };
  }
}

export async function postAnswers(
  payload: AnswerPayload[]
): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  try {
    const response = await apiClient.post('/api/answers', payload);
    const data = response.data as { ok?: boolean; error?: { code: string; message: string } };
    if (!data.ok) {
      return {
        success: false,
        error: data.error || { code: 'ANSWERS_ERROR', message: 'No se pudo enviar respuestas.' },
      };
    }
    return { success: true };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'ANSWERS_ERROR',
        message: lastError.message || 'No se pudo enviar respuestas.',
      },
    };
  }
}

export async function createStudySession(payload: StudySessionPayload): Promise<StudySessionResult> {
  try {
    const response = await apiClient.post('/api/study-sessions', payload, { withCredentials: true });
    const data = response.data as {
      ok?: boolean;
      data?: { sessionId: string; xpAwarded: number };
      error?: { code: string; message: string };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'STUDY_SESSION_ERROR', message: 'No se pudo registrar la sesión.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'STUDY_SESSION_ERROR',
        message: lastError.message || 'No se pudo registrar la sesión.',
      },
    };
  }
}

export async function getTimeTrialModes(): Promise<{
  success: boolean;
  data?: TimeTrialMode[];
  error?: { code: string; message: string };
}> {
  try {
    const response = await apiClient.get('/api/time-trial/modes');
    const data = response.data as { ok?: boolean; data?: TimeTrialMode[]; error?: { code: string; message: string } };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'TIME_TRIAL_MODES_ERROR', message: 'No se pudieron cargar los retos.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'TIME_TRIAL_MODES_ERROR',
        message: lastError.message || 'No se pudieron cargar los retos.',
      },
    };
  }
}

export async function startTimeTrial(params: {
  modeId?: string;
  custom?: { area: Area; dificultad: Dificultad; timeLimitSeconds: number; questions: number };
}): Promise<TimeTrialStartResult> {
  try {
    const response = await apiClient.post('/api/time-trial/start', params, {
      withCredentials: true,
      timeout: 600000,
    });
    const data = response.data as {
      ok?: boolean;
      data?: { sessionId: string; timeLimitSeconds: number; items: IcfesItem[] };
      error?: { code: string; message: string };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'TIME_TRIAL_START_ERROR', message: 'No se pudo iniciar contrarreloj.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'TIME_TRIAL_START_ERROR',
        message: lastError.message || 'No se pudo iniciar contrarreloj.',
      },
    };
  }
}

export async function getFeedback(sessionId: string): Promise<FeedbackResult> {
  try {
    const response = await apiClient.get(`/api/feedback/${sessionId}`);
    const data = response.data as {
      ok?: boolean;
      data?: FeedbackPayload;
      error?: { code: string; message: string };
      meta?: { cached?: boolean };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'FEEDBACK_ERROR', message: 'No se pudo cargar el feedback.' },
      };
    }
    return { success: true, data: data.data, cached: data.meta?.cached };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    if (lastError.response?.status === 404) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'No feedback available.' },
      };
    }
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'FEEDBACK_ERROR',
        message: lastError.message || 'No se pudo cargar el feedback.',
      },
    };
  }
}

export async function generateFeedback(params: {
  sessionId: string;
  mode: string;
  focus?: string;
  language?: string;
  force?: boolean;
}): Promise<FeedbackResult> {
  try {
    const response = await apiClient.post('/api/feedback/generate', params, { withCredentials: true });
    const data = response.data as {
      ok?: boolean;
      data?: FeedbackPayload;
      error?: { code: string; message: string };
      meta?: { cached?: boolean };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'FEEDBACK_ERROR', message: 'No se pudo generar el feedback.' },
      };
    }
    return { success: true, data: data.data, cached: data.meta?.cached };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'FEEDBACK_ERROR',
        message: lastError.message || 'No se pudo generar el feedback.',
      },
    };
  }
}

export async function startStudySession(payload: StudySessionStartPayload): Promise<StudySessionStartResult> {
  try {
    const response = await apiClient.post('/api/study-sessions/start', payload, { withCredentials: true });
    const data = response.data as {
      ok?: boolean;
      data?: { sessionId: string; startedAt: string };
      error?: { code: string; message: string };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'STUDY_SESSION_START_ERROR', message: 'No se pudo iniciar la sesión.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'STUDY_SESSION_START_ERROR',
        message: lastError.message || 'No se pudo iniciar la sesión.',
      },
    };
  }
}

export async function heartbeatStudySession(
  sessionId: string,
  payload: { elapsedSeconds: number; endedAt?: string }
): Promise<StudySessionHeartbeatResult> {
  try {
    const response = await apiClient.post(`/api/study-sessions/${sessionId}/heartbeat`, payload, { withCredentials: true });
    const data = response.data as {
      ok?: boolean;
      data?: { id: string; durationSeconds: number; endedAt?: string; lastHeartbeatAt?: string };
      error?: { code: string; message: string };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'STUDY_SESSION_HEARTBEAT_ERROR', message: 'No se pudo enviar heartbeat.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'STUDY_SESSION_HEARTBEAT_ERROR',
        message: lastError.message || 'No se pudo enviar heartbeat.',
      },
    };
  }
}

export async function completeStudySession(
  sessionId: string,
  payload: {
    endedAt: string;
    durationSeconds: number;
    totalQuestions: number;
    correctQuestions: number;
    areaSummary?: Array<{ area: Area; totalQuestions: number; correctQuestions: number }>;
  }
): Promise<StudySessionResult> {
  try {
    const response = await apiClient.post(`/api/study-sessions/${sessionId}/complete`, payload, { withCredentials: true });
    const data = response.data as {
      ok?: boolean;
      data?: { sessionId: string; xpAwarded: number; xpDelta?: number };
      error?: { code: string; message: string };
    };
    if (!data.ok || !data.data) {
      return {
        success: false,
        error: data.error || { code: 'STUDY_SESSION_COMPLETE_ERROR', message: 'No se pudo completar la sesión.' },
      };
    }
    return { success: true, data: data.data };
  } catch (error) {
    const lastError = error as AxiosError<{ error?: { code: string; message: string } }>;
    return {
      success: false,
      error: lastError.response?.data?.error || {
        code: 'STUDY_SESSION_COMPLETE_ERROR',
        message: lastError.message || 'No se pudo completar la sesión.',
      },
    };
  }
}

export async function generateMixedItems(
  request: GenerateMixedRequest,
  options: GenerateItemsOptions = {}
): Promise<GenerateItemsResult> {
  try {
    const response = await apiClient.post<ApiResponse<IcfesItem>>(
      '/api/items/generate-mixed',
      request,
      { signal: options.signal }
    );
    const data = response.data as ApiResponse<IcfesItem> & {
      meta?: { session?: { sessionId?: string } };
    };

    if (!data.ok || !data.items) {
      return {
        success: false,
        items: [],
        requestId: data.meta?.requestId,
        sessionId: data.meta?.session?.sessionId,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'Error inesperado' },
      };
    }

    return {
      success: true,
      items: data.items,
      requestId: data.meta?.requestId,
      sessionId: data.meta?.session?.sessionId,
    };
  } catch (error) {
    const lastError = error as AxiosError<ApiResponse<IcfesItem>>;
    return {
      success: false,
      items: [],
      error: lastError.response?.data?.error || {
        code: 'MIXED_GENERATION_ERROR',
        message: lastError.message || 'No se pudo generar la prueba.',
      },
    };
  }
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
