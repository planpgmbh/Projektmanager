import React from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { formatTimeDisplay } from '../../utils/time';

interface LiveTimerProps {
  isActive: boolean;
  displayHours: number;
  allowManualEdit?: boolean;
  onStart: () => void;
  onStop: () => void;
  onManualEdit?: (hours: number) => void;
  isEditing?: boolean;
  editingValue?: string;
  onEditingValueChange?: (value: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
}

export function LiveTimer({
  isActive,
  displayHours = 0,
  allowManualEdit = true,
  onStart,
  onStop,
  onManualEdit,
  isEditing = false,
  editingValue = '',
  onEditingValueChange,
  onSaveEdit,
  onCancelEdit,
  onKeyDown,
  className = ''
}: LiveTimerProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      onStop();
    } else {
      onStart();
    }
  };

  const handleTimeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActive && allowManualEdit && onManualEdit) {
      onManualEdit(displayHours);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Time Display */}
      <div className="text-sm font-medium text-gray-900">
        {isEditing ? (
          <input
            type="text"
            value={editingValue}
            onChange={(e) => onEditingValueChange?.(e.target.value)}
            onBlur={onSaveEdit}
            onFocus={(e) => e.target.select()}
            onKeyDown={onKeyDown}
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span
            onClick={handleTimeClick}
            className={`${!isActive && allowManualEdit ? 'cursor-text hover:text-blue-600' : ''}`}
          >
            {formatTimeDisplay(displayHours)}
          </span>
        )}
      </div>
      
      {/* Timer Control Button - ALWAYS VISIBLE */}
      <button
        onClick={handleTimerClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`p-1 rounded-full transition-all duration-200 ${
          isActive 
            ? 'text-blue-600 hover:bg-red-50 hover:text-red-600' 
            : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
        }`}
        title={isActive ? 'Timer stoppen' : 'Timer starten'}
      >
        {isActive ? (
          isHovered ? (
            <Square className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4 animate-spin" />
          )
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}