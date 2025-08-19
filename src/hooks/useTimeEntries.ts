import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthState } from './useAuthState';

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  priceItemId: string;
  hours: number;
  note: string;
  date: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  timerStartedAt?: Date;
  timerSeconds?: number;
}

export function useTimeEntries() {
  const { user } = useAuthState();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTimeEntries([]);
      setIsLoading(false);
      return;
    }

    const timeEntriesQuery = query(
      collection(db, 'timeEntries'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(timeEntriesQuery, (snapshot) => {
      const timeEntriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        timerStartedAt: doc.data().timerStartedAt?.toDate()
      })) as TimeEntry[];
      
      // Sort by date and creation time
      timeEntriesData.sort((a, b) => {
        if (a.date === b.date) {
          const aCreated = a.createdAt || new Date(0);
          const bCreated = b.createdAt || new Date(0);
          return bCreated.getTime() - aCreated.getTime();
        }
        return 0;
      });
      
      setTimeEntries(timeEntriesData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching time entries:', error);
      setError('Fehler beim Laden der Zeiteinträge');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTimeEntry = useCallback(async (newEntry: Omit<TimeEntry, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('🔥 addTimeEntry called with:', newEntry);
      
      const entryData = {
        ...newEntry,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
        // CRITICAL: Don't override isActive - let it come from newEntry
      };

      console.log('💾 Saving to Firebase with data:', entryData);
      await addDoc(collection(db, 'timeEntries'), entryData);
      console.log('✅ Successfully saved to Firebase');
      setError(null);
    } catch (err) {
      console.error('❌ Error adding time entry:', err);
      setError('Fehler beim Hinzufügen des Zeiteintrags');
      throw err;
    }
  }, [user]);

  const updateTimeEntry = useCallback(async (entryId: string, updates: Partial<TimeEntry>) => {
    try {
      const entryRef = doc(db, 'timeEntries', entryId);
      await updateDoc(entryRef, {
        ...updates,
        updatedAt: new Date()
      });
      setError(null);
    } catch (err) {
      console.error('Error updating time entry:', err);
      setError('Fehler beim Aktualisieren des Zeiteintrags');
      throw err;
    }
  }, []);

  const deleteTimeEntry = useCallback(async (entryId: string) => {
    try {
      await deleteDoc(doc(db, 'timeEntries', entryId));
      setError(null);
    } catch (err) {
      console.error('Error deleting time entry:', err);
      setError('Fehler beim Löschen des Zeiteintrags');
      throw err;
    }
  }, []);

  const duplicateTimeEntry = useCallback(async (entry: TimeEntry) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const newEntry = {
        projectId: entry.projectId,
        taskId: entry.taskId,
        priceItemId: entry.priceItemId,
        hours: entry.hours,
        note: `${entry.note} (Kopie)`,
        date: entry.date,
        userId: user.uid,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'timeEntries'), newEntry);
      setError(null);
    } catch (err) {
      console.error('Error duplicating time entry:', err);
      setError('Fehler beim Duplizieren des Zeiteintrags');
      throw err;
    }
  }, [user]);

  const getEntriesForDate = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return timeEntries.filter(entry => entry.date === dateString);
  }, [timeEntries]);

  const getTotalHours = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return timeEntries
      .filter(entry => entry.date === dateString)
      .reduce((total, entry) => {
        let hours = entry.hours;
        if (entry.isActive && entry.timerSeconds) {
          hours += entry.timerSeconds / 3600;
        }
        return total + hours;
      }, 0);
  }, [timeEntries]);

  const getWeeklyHours = useCallback((selectedDate: Date) => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return timeEntries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      })
      .reduce((total, entry) => {
        let hours = entry.hours;
        if (entry.isActive && entry.timerSeconds) {
          hours += entry.timerSeconds / 3600;
        }
        return total + hours;
      }, 0);
  }, [timeEntries]);

  return {
    timeEntries,
    isLoading,
    error,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    duplicateTimeEntry,
    getEntriesForDate,
    getTotalHours,
    getWeeklyHours
  };
}