import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Dropdown } from './Dropdown';

interface SearchableSelectItem {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  items: SearchableSelectItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  items,
  selectedId,
  onSelect,
  placeholder,
  disabled = false,
  className = ''
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedItem = items.find(item => item.id === selectedId);
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Dropdown
        trigger={
          <div className={`relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="text"
              value={isOpen ? searchTerm : (selectedItem?.name || '')}
              onChange={handleInputChange}
              onClick={handleInputClick}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              readOnly={!isOpen}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {isOpen ? (
                <Search className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        }
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        contentClassName="max-h-60 overflow-y-auto"
        maxWidth="100%"
      >
        <div className="py-1">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                  item.id === selectedId ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'
                }`}
              >
                {item.name}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Keine Ergebnisse gefunden
            </div>
          )}
        </div>
      </Dropdown>
    </div>
  );
}