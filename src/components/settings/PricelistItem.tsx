import React, { useState, useContext } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { MoreHorizontal } from 'lucide-react';
import { PriceItem } from './SettingsTabPricing_Types';
import { PricingContext } from './SettingsTabPricing_Context';

interface PricelistItemProps {
  item: PriceItem;
  index: number;
  onDuplicate: () => void;
  onDelete: () => void;
}

function PricelistItem({
  item,
  index,
  onDuplicate,
  onDelete
}: PricelistItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const {
    editingNameId,
    editingHourlyRateId,
    editingDailyRateId,
    editingItemName,
    editingHourlyRate,
    editingDailyRate,
    handleItemNameEdit,
    handleHourlyRateEdit,
    handleDailyRateEdit,
    setEditingNameId,
    setEditingHourlyRateId,
    setEditingDailyRateId,
    setEditingItemName,
    setEditingHourlyRate,
    setEditingDailyRate,
    formatCurrency
  } = useContext(PricingContext);

  const handleNameClick = () => {
    setEditingNameId(item.id);
    setEditingItemName(item.name);
  };

  const handleHourlyRateClick = () => {
    setEditingHourlyRateId(item.id);
    setEditingHourlyRate(item.hourlyRate.toString());
  };

  const handleDailyRateClick = () => {
    setEditingDailyRateId(item.id);
    setEditingDailyRate(item.dailyRate.toString());
  };

  const handleNameBlur = () => {
    if (editingItemName.trim()) {
      handleItemNameEdit(item.id, editingItemName);
    }
    setEditingNameId(null);
  };

  const handleHourlyRateBlur = () => {
    handleHourlyRateEdit(item.id, editingHourlyRate);
    setEditingHourlyRateId(null);
  };

  const handleDailyRateBlur = () => {
    handleDailyRateEdit(item.id, editingDailyRate);
    setEditingDailyRateId(null);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setEditingNameId(null);
    }
  };

  const handleHourlyRateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHourlyRateBlur();
    } else if (e.key === 'Escape') {
      setEditingHourlyRateId(null);
    }
  };

  const handleDailyRateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleDailyRateBlur();
    } else if (e.key === 'Escape') {
      setEditingDailyRateId(null);
    }
  };

  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="grid grid-cols-[1fr_200px_200px] gap-4 px-6 py-2 bg-white hover:bg-gray-50 border-b border-gray-200 group"
        >
          {/* Name Spalte - Breite begrenzt auf Inhalt */}
          <div className="flex items-center">
            <div className="inline-flex items-center gap-2">
              {editingNameId === item.id ? (
                <input
                  type="text"
                  value={editingItemName}
                  onChange={(e) => setEditingItemName(e.target.value)}
                  onBlur={handleNameBlur}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={handleNameKeyDown}
                  className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
                  autoFocus
                />
              ) : (
                <>
                  <span
                    onClick={handleNameClick}
                    className="text-sm text-gray-900 cursor-text hover:text-blue-600"
                  >
                    {item.name}
                  </span>
                  
                  {/* Drei-Punkt-Icon direkt neben dem Namen */}
                  <div className="relative">
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
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onDuplicate();
                              setShowMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Duplizieren
                          </button>
                          <button
                            onClick={() => {
                              onDelete();
                              setShowMenu(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Stundensatz Spalte */}
          <div className="text-right">
            {editingHourlyRateId === item.id ? (
              <input
                type="number"
                value={editingHourlyRate}
                onChange={(e) => setEditingHourlyRate(e.target.value)}
                onBlur={handleHourlyRateBlur}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleHourlyRateKeyDown}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-right"
                autoFocus
              />
            ) : (
              <span
                onClick={handleHourlyRateClick}
                className="text-sm text-gray-900 cursor-text hover:text-blue-600"
              >
                {formatCurrency(item.hourlyRate)}
              </span>
            )}
          </div>
          
          {/* Tagessatz Spalte */}
          <div className="text-right">
            {editingDailyRateId === item.id ? (
              <input
                type="number"
                value={editingDailyRate}
                onChange={(e) => setEditingDailyRate(e.target.value)}
                onBlur={handleDailyRateBlur}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleDailyRateKeyDown}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-right"
                autoFocus
              />
            ) : (
              <span
                onClick={handleDailyRateClick}
                className="text-sm text-gray-900 cursor-text hover:text-blue-600"
              >
                {formatCurrency(item.dailyRate)}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default PricelistItem;