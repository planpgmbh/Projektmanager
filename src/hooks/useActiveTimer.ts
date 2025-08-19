import { useState, useEffect, useCallback } from 'react';
import { useTimer } from '../context/TimerContext';
import { TimeEntry } from './useTimeEntries';
import { roundToNext15Minutes } from '../utils/time';

export function useActiveTimer(timeEntries: TimeEntry[], updateTimeEntry: (entryId: string, updates: Partial<TimeEntry>) => Promise<void>) {
  const { setIsTimerActive } = useTimer();

  // Update timer context when time entries change
  useEffect(() => {
    const hasActiveTimer = timeEntries.some(entry => entry.isActive);
    setIsTimerActive(hasActiveTimer);
  }, [timeEntries, setIsTimerActive]);

  // Timer update interval
  useEffect(() => {
    const interval = setInterval(() => {
      const activeEntry = timeEntries.find(entry => entry.isActive);
      if (activeEntry && activeEntry.timerStartedAt) {
        const now = new Date();
        const startTime = new Date(activeEntry.timerStartedAt);
        const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Update timer seconds in Firebase
        updateTimeEntry(activeEntry.id, { timerSeconds: elapsedSeconds }).catch(err => {
          console.error('Error updating timer:', err);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeEntries, updateTimeEntry]);

  const startTimer = useCallback(async (entryId: string) => {
    try {
      // Stop any currently active timer (except the one we're starting)
      const activeEntry = timeEntries.find(entry => entry.isActive && entry.id !== entryId);
      if (activeEntry) {
        await stopTimer(activeEntry.id);
      }

      await updateTimeEntry(entryId, {
        isActive: true,
        timerStartedAt: new Date(),
        timerSeconds: 0
      });
    } catch (err) {
      console.error('Error starting timer:', err);
      throw new Error('Fehler beim Starten des Timers');
    }
  }, [timeEntries, updateTimeEntry]);

  const stopTimer = useCallback(async (entryId: string) => {
    try {
      const entry = timeEntries.find(e => e.id === entryId);
      if (!entry) return;

      const finalSeconds = entry.timerSeconds || 0;
      const rawHours = entry.hours + (finalSeconds / 3600);
      
      // Runde auf das nächste 15-Minuten-Intervall auf
      const roundedHours = roundToNext15Minutes(rawHours);

      await updateTimeEntry(entryId, {
        isActive: false,
        hours: roundedHours,
        timerStartedAt: null,
        timerSeconds: 0
      });
    } catch (err) {
      console.error('Error stopping timer:', err);
      throw new Error('Fehler beim Stoppen des Timers');
    }
  }, [timeEntries, updateTimeEntry]);

  const createTimerEntry = useCallback(async (timerEntry: Omit<TimeEntry, 'id' | 'userId' | 'hours'>, addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'userId'>) => Promise<void>) => {
    try {
      // Stop any currently active timer first
      const activeEntry = timeEntries.find(entry => entry.isActive);
      if (activeEntry) {
        await stopTimer(activeEntry.id);
      }

      // Create new timer entry with active state
      const entryData = {
        ...timerEntry,
        hours: 0,
        isActive: true,
        timerStartedAt: new Date(),
        timerSeconds: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addTimeEntry(entryData);
    } catch (err) {
      console.error('Error creating timer entry:', err);
      throw new Error('Fehler beim Starten des Timers');
    }
  }, [timeEntries, stopTimer]);

  // Calculate current display time for active timers
  const getCurrentDisplayTime = useCallback((entry: TimeEntry) => {
    let displayHours = entry.hours;
    
    if (entry.isActive && entry.timerStartedAt) {
      const now = new Date();
      const startTime = new Date(entry.timerStartedAt);
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      displayHours += elapsedSeconds / 3600;
    } else if (entry.isActive && entry.timerSeconds) {
      displayHours += entry.timerSeconds / 3600;
    }
    
    return displayHours;
  }, []);

  return {
    startTimer,
    stopTimer,
    createTimerEntry,
    getCurrentDisplayTime
  };
}