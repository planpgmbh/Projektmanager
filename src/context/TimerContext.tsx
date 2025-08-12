import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TimerContextType {
  isTimerActive: boolean;
  setIsTimerActive: (active: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const [isTimerActive, setIsTimerActive] = useState(false);

  return (
    <TimerContext.Provider value={{ isTimerActive, setIsTimerActive }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}