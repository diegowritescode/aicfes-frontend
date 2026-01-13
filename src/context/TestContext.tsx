import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { IcfesItem, AnswerKey, AnswerRecord, Area } from '@/types/icfes';

interface TestState {
  questions: IcfesItem[];
  currentQuestionIndex: number;
  selectedAnswer: AnswerKey | null;
  answersHistory: AnswerRecord[];
  isTestActive: boolean;
  testArea: Area | null;
  testStartTime: Date | null;
}

interface TestContextValue extends TestState {
  startTest: (questions: IcfesItem[], area: Area) => void;
  selectAnswer: (answer: AnswerKey) => void;
  confirmAnswer: () => void;
  nextQuestion: () => void;
  resetTest: () => void;
  getCurrentQuestion: () => IcfesItem | null;
  isLastQuestion: () => boolean;
  getResults: () => {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    answersHistory: AnswerRecord[];
    area: Area | null;
  };
}

const initialState: TestState = {
  questions: [],
  currentQuestionIndex: 0,
  selectedAnswer: null,
  answersHistory: [],
  isTestActive: false,
  testArea: null,
  testStartTime: null,
};

const TestContext = createContext<TestContextValue | undefined>(undefined);

export function TestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TestState>(initialState);

  const startTest = useCallback((questions: IcfesItem[], area: Area) => {
    setState({
      questions,
      currentQuestionIndex: 0,
      selectedAnswer: null,
      answersHistory: [],
      isTestActive: true,
      testArea: area,
      testStartTime: new Date(),
    });
  }, []);

  const selectAnswer = useCallback((answer: AnswerKey) => {
    setState((prev) => ({ ...prev, selectedAnswer: answer }));
  }, []);

  const confirmAnswer = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedAnswer) return prev;

      const currentQuestion = prev.questions[prev.currentQuestionIndex];
      const isCorrect = prev.selectedAnswer === currentQuestion.respuesta_correcta;

      const record: AnswerRecord = {
        questionIndex: prev.currentQuestionIndex,
        selectedAnswer: prev.selectedAnswer,
        correctAnswer: currentQuestion.respuesta_correcta,
        isCorrect,
      };

      return {
        ...prev,
        answersHistory: [...prev.answersHistory, record],
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      selectedAnswer: null,
    }));
  }, []);

  const resetTest = useCallback(() => {
    setState(initialState);
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
