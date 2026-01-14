// AICFES Item data model
export interface IcfesItem {
  area: Area;
  dificultad: Dificultad;
  plantilla: string;
  contexto: string;
  pregunta: string;
  opciones: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  respuesta_correcta: AnswerKey;
  justificacion: string;
  tags: string[];
  distractores?: Record<AnswerKey, string>;
  explicaciones?: Record<AnswerKey, string>;
}

export type Area = 'MAT' | 'LC' | 'CN' | 'SOC' | 'ING';
export type Dificultad = 'facil' | 'media' | 'alta';
export type AnswerKey = 'A' | 'B' | 'C' | 'D';

export interface GenerateRequest {
  area: Area;
  dificultad: Dificultad;
  tema?: string;
  n: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  items: T[];
  meta: {
    requestId: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface AnswerRecord {
  questionIndex: number;
  selectedAnswer: AnswerKey;
  correctAnswer: AnswerKey;
  isCorrect: boolean;
  explanation?: string;
  answeredAt?: string; // ISO timestamp
}

export const AREA_LABELS: Record<Area, string> = {
  MAT: 'Matemáticas',
  LC: 'Lectura Crítica',
  CN: 'Ciencias Naturales',
  SOC: 'Sociales y Ciudadanas',
  ING: 'Inglés',
};

export const DIFICULTAD_LABELS: Record<Dificultad, string> = {
  facil: 'Fácil',
  media: 'Media',
  alta: 'Alta',
};
