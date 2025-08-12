import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { DraggableProvided } from 'react-beautiful-dnd';

interface TableRowProps {
  id: string;
  name: string;
  onNameEdit: (newName: string) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  dragHandleProps?: DraggableProvided['dragHandleProps'];
  innerRef?: (element: HTMLElement | null) => void;
  draggableProps?: any;
  className?: string;
  children?: React.ReactNode;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export function TableRow({
  id,
  name,
  onNameEdit,
  onDelete,
  onDuplicate,
  dragHandleProps,
  innerRef,
  draggableProps,
  className = '',
  children,
  isExpanded = true,
  onExpandToggle
}: TableRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== name) {
      onNameEdit(editedName);
    } else {
      setEditedName(name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={`select-none bg-white transition-colors duration-150 ${className}`}
    >
      <div
        {...dragHandleProps}
        className="flex items-center px-6 py-3 gap-4 hover:bg-gray-50 cursor-pointer"
        onClick={onExpandToggle}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpandToggle?.();
          }}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
        >
          <ChevronRight
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'transform rotate-90' : ''
            }`}
          />
        </button>

        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-shrink min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleNameSave}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleKeyDown}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-32"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="font-medium text-gray-900 cursor-text hover:text-blue-600 truncate"
              >
                {name}
              </div>
            )}
          </div>

          {(onDelete || onDuplicate) && (
            <div className="relative ml-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition-opacity duration-200"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </button>

              {showMenu && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
                >
                  <div className="py-1">
                    {onDuplicate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate();
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Duplizieren
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                          setShowMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isExpanded && children}
    </div>
  );
}