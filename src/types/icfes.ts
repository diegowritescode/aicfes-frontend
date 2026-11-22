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
  /**
   * A diagram drawn from the item's own numbers. The API serves it as
   * SVG; the client only needs to know whether there is one.
   */
  figura?: { plantilla: string; parametros: Record<string, unknown>; alt?: string } | null;
  /** Present once the item is stored, which is what the figure URL needs. */
  id?: string;
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
  /** Which stored item this answers, so the server can attribute it. */
  itemId?: string;
  /** Milliseconds on this question. A right answer that took three
   *  minutes is not the same as one that took twenty seconds. */
  tiempoMs?: number;
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
