import { useState, useCallback } from 'react';

export function useInlineEdit() {
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const startEditing = useCallback((entryId: string, field: string, currentValue: string) => {
    setEditingEntryId(entryId);
    setEditingField(field);
    
    if (field === 'hours') {
      const hours = parseFloat(currentValue);
      const wholeHours = Math.floor(hours);
      const minutes = Math.round((hours - wholeHours) * 60);
      setEditingValue(`${wholeHours}:${minutes.toString().padStart(2, '0')}`);
    } else {
      setEditingValue(currentValue);
    }
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingEntryId(null);
    setEditingField(null);
    setEditingValue('');
  }, []);

  const isEditing = useCallback((entryId: string, field: string) => {
    return editingEntryId === entryId && editingField === field;
  }, [editingEntryId, editingField]);

  return {
    editingEntryId,
    editingField,
    editingValue,
    setEditingValue,
    startEditing,
    cancelEdit,
    isEditing
  };
}