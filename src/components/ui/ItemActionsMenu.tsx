import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

interface ItemActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddPerson?: () => void;
  deleteMessage?: string;
  className?: string;
}

function ItemActionsMenu({
  onEdit,
  onDelete,
  onDuplicate,
  onAddPerson,
  deleteMessage = 'Möchten Sie diesen Eintrag wirklich löschen?',
  className = ''
}: ItemActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleActionClick = (action: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      action();
      setShowMenu(false);
    };
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };

  // Don't render if no actions are provided
  if (!onEdit && !onDelete && !onDuplicate && !onAddPerson) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`} ref={menuRef}>
        <button
          onClick={handleMenuClick}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          title="Aktionen"
        >
          <MoreHorizontal className="h-4 w-4 text-gray-400" />
        </button>
        
        {showMenu && (
          <div className="fixed bg-white rounded-md shadow-lg border border-gray-200 w-48 py-1 z-[9999]"
               style={{
                 top: menuRef.current ? 
                   Math.min(
                     menuRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
                     window.innerHeight + window.scrollY - 200
                   ) : 0,
                 left: menuRef.current ? 
                   Math.max(
                     menuRef.current.getBoundingClientRect().right + window.scrollX - 192,
                     8
                   ) : 0
               }}>
            {onEdit && (
              <button
                onClick={handleActionClick(onEdit)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Bearbeiten
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={handleActionClick(onDuplicate)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Duplizieren
              </button>
            )}
            {onAddPerson && (
              <button
                onClick={handleActionClick(onAddPerson)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Person hinzufügen
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDeleteClick}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Löschen
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Löschen bestätigen"
        message={deleteMessage}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

export default ItemActionsMenu;