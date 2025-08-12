import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { Button } from './Button';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  onAddClick?: () => void;
  addButtonLabel?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  customFilter?: (item: T, searchTerm: string) => boolean;
}

function Table<T extends Record<string, any>>({
  data,
  columns,
  searchKeys = [],
  searchPlaceholder = "Suche...",
  onAddClick,
  addButtonLabel = "Hinzufügen",
  className = "",
  onRowClick,
  customFilter,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = searchTerm
    ? customFilter
      ? data.filter(item => customFilter(item, searchTerm))
      : data.filter(item =>
          searchKeys.some(key => {
            const value = item[key];
            return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
          })
        )
    : data;

  const handleRowClick = (e: React.MouseEvent, item: T) => {
    // Check if the click originated from a select, button, or action buttons container
    const target = e.target as HTMLElement;
    const isSelectClick = target.closest('select');
    const isActionButtonClick = target.closest('.action-buttons');
    const isButtonClick = target.closest('button');

    // Only trigger row click if not clicking on interactive elements
    if (!isSelectClick && !isActionButtonClick && !isButtonClick) {
      onRowClick?.(item);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <SearchBar
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
        {onAddClick && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={onAddClick}
            className="shrink-0"
          >
            {addButtonLabel}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.header === 'Aktionen' ? 'w-12' : ''
                  } ${column.className || ''}`}
                >
                  {column.header === 'Aktionen' ? '' : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={(e) => handleRowClick(e, item)}
                className={`group transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                }`}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      colIndex === 0 ? 'text-gray-900' : 'text-gray-500'
                    } ${column.header === 'Aktionen' ? 'w-12 relative' : ''} ${column.className || ''}`}
                  >
                    {typeof column.accessor === 'function'
                      ? column.accessor(item)
                      : item[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50"
                >
                  Keine Einträge gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;