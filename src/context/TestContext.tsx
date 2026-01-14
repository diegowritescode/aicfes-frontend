import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { IcfesItem, AnswerKey, AnswerRecord, Area, Dificultad } from '@/types/icfes';

interface TestState {
  questions: IcfesItem[];
  currentQuestionIndex: number;
  selectedAnswer: AnswerKey | null;
  answersHistory: AnswerRecord[];
  isTestActive: boolean;
  testArea: Area | null;
  testDifficulty: Dificultad | null;
  testTopic: string | null;
  testMode: 'generacion_libre' | 'contrarreloj' | 'test' | null;
  studySessionId: string | null;
  testStartTime: Date | null;
}

interface TestContextValue extends TestState {
  startTest: (
    questions: IcfesItem[],
    area: Area,
    options?: { dificultad?: Dificultad | null; tema?: string | null; mode?: 'generacion_libre' | 'contrarreloj' | 'test' }
  ) => void;
  selectAnswer: (answer: AnswerKey) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  resetTest: () => void;
  getCurrentQuestion: () => IcfesItem | null;
  isLastQuestion: () => boolean;
  setStudySessionId: (sessionId: string | null) => void;
  getResults: () => {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    answersHistory: AnswerRecord[];
    area: Area | null;
  };
}

const STORAGE_KEY = 'aicfes_test_state_v1';

const initialState: TestState = {
  questions: [],
  currentQuestionIndex: 0,
  selectedAnswer: null,
  answersHistory: [],
  isTestActive: false,
  testArea: null,
  testDifficulty: null,
  testTopic: null,
  testMode: null,
  studySessionId: null,
  testStartTime: null,
};

function loadStateFromSession(): TestState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as TestState & { testStartTime?: string };
    return {
      ...parsed,
      testStartTime: parsed.testStartTime ? new Date(parsed.testStartTime) : null,
    };
  } catch (e) {
    console.warn('Failed to load test state from sessionStorage', e);
    return initialState;
  }
}

function saveStateToSession(state: TestState) {
  try {
    const toStore = {
      ...state,
      testStartTime: state.testStartTime ? state.testStartTime.toISOString() : undefined,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.warn('Failed to save test state to sessionStorage', e);
  }
}

const TestContext = createContext<TestContextValue | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TestState>(() => loadStateFromSession());

  const startTest = useCallback((
    questions: IcfesItem[],
    area: Area,
    options?: { dificultad?: Dificultad | null; tema?: string | null; mode?: 'generacion_libre' | 'contrarreloj' | 'test' }
  ) => {
    const newState: TestState = {
      questions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answersHistory: [],
      isTestActive: true,
      testArea: area,
      testDifficulty: options?.dificultad ?? null,
      testTopic: options?.tema ?? null,
      testMode: options?.mode ?? 'test',
      studySessionId: null,
      testStartTime: new Date(),
    };
    setState(newState);
    saveStateToSession(newState);
  }, []);

  const selectAnswer = useCallback((answer: AnswerKey) => {
    setState((prev) => {
      const next = { ...prev, selectedAnswer: answer };
      saveStateToSession(next);
      return next;
    });
  }, []);

  const confirmAnswer = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedAnswer) return prev;

      const currentQuestion = prev.questions[prev.currentQuestionIndex];
      const isCorrect = prev.selectedAnswer === currentQuestion.respuesta_correcta;
      const explanation = currentQuestion.explicaciones?.[prev.selectedAnswer] || currentQuestion.justificacion;

      const record: AnswerRecord = {
        questionIndex: prev.currentQuestionIndex,
        selectedAnswer: prev.selectedAnswer,
        correctAnswer: currentQuestion.respuesta_correcta,
        isCorrect,
        explanation,
        answeredAt: new Date().toISOString(),
      };

      const next = {
        ...prev,
        answersHistory: [...prev.answersHistory, record],
      };
      saveStateToSession(next);
      return next;
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => {
      const next = {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        selectedAnswer: null,
      };
      saveStateToSession(next);
      return next;
    });
  }, []);

  const setStudySessionId = useCallback((sessionId: string | null) => {
    setState((prev) => {
      const next = { ...prev, studySessionId: sessionId };
      saveStateToSession(next);
      return next;
    });
  }, []);

  const resetTest = useCallback(() => {
    setState(initialState);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }, []);

  const getCurrentQuestion = useCallback(() => {
    return state.questions[state.currentQuestionIndex] || null;
  }, [state.questions, state.currentQuestionIndex]);

  const isLastQuestion = useCallback(() => {
    return state.currentQuestionIndex >= state.questions.length - 1;
  }, [state.currentQuestionIndex, state.questions.length]);

  const getResults = useCallback(() => {
    const total = state.answersHistory.length;
    const correct = state.answersHistory.filter((a) => a.isCorrect).length;
    const incorrect = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      total,
      correct,
      incorrect,
      accuracy,
      answersHistory: state.answersHistory,
      area: state.testArea,
    };
  }, [state.answersHistory, state.testArea]);

  return (
    <TestContext.Provider
      value={{
        ...state,
        startTest,
        selectAnswer,
        confirmAnswer,
        nextQuestion,
        resetTest,
        getCurrentQuestion,
        isLastQuestion,
        setStudySessionId,
        getResults,
      }}
    >
      {children}
    </TestContext.Provider>
  );
}

export function useTest() {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
}
