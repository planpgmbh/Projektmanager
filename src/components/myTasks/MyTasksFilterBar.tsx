import React from 'react';
import { ChevronDown, ChevronUp, X, Calendar } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';

interface FilterState {
  status: string[];
  customer: string[];
  dueDate: string;
}

interface SortState {
  field: 'name' | 'customerName' | 'date' | 'totalEffort' | null;
  direction: 'asc' | 'desc';
}

interface MyTasksFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  sort: SortState;
  uniqueCustomers: string[];
  hasUserInteractedWithFilters: boolean;
  hasActiveFilters: boolean;
  isStatusFilterOpen: boolean;
  isCustomerFilterOpen: boolean;
  isDueDateFilterOpen: boolean;
  onStatusFilterOpenChange: (isOpen: boolean) => void;
  onCustomerFilterOpenChange: (isOpen: boolean) => void;
  onDueDateFilterOpenChange: (isOpen: boolean) => void;
  onStatusFilterChange: (statusValue: string) => void;
  onCustomerFilterChange: (customerName: string) => void;
  onDueDateFilterChange: (dueDateValue: string) => void;
  onClearAllFilters: () => void;
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Offen' },
  { value: 'completed', label: 'Abgeschlossen' },
];

const DUE_DATE_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'overdue', label: 'Überfällig' },
  { value: 'today', label: 'Heute' },
  { value: 'this_week', label: 'Diese Woche' },
  { value: 'next_week', label: 'Nächste Woche' },
  { value: 'no_date', label: 'Ohne Datum' },
];

function MyTasksFilterBar({
  searchTerm,
  onSearchChange,
  filters,
  sort,
  uniqueCustomers,
  hasUserInteractedWithFilters,
  hasActiveFilters,
  isStatusFilterOpen,
  isCustomerFilterOpen,
  isDueDateFilterOpen,
  onStatusFilterOpenChange,
  onCustomerFilterOpenChange,
  onDueDateFilterOpenChange,
  onStatusFilterChange,
  onCustomerFilterChange,
  onDueDateFilterChange,
  onClearAllFilters
}: MyTasksFilterBarProps) {
  
  const getDueDateLabel = () => {
    const option = DUE_DATE_OPTIONS.find(opt => opt.value === filters.dueDate);
    return option ? option.label : 'Alle';
  };

  return (
    <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
      <div className="flex items-center gap-4 flex-1">
        <SearchBar
          placeholder="Suche nach Aufgaben..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 max-w-md"
        />
        
        {/* Status Filter */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
              <span className="text-gray-700">Status</span>
              {hasUserInteractedWithFilters && filters.status.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {filters.status.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
          }
          isOpen={isStatusFilterOpen}
          onOpenChange={onStatusFilterOpenChange}
          maxWidth="200px"
        >
          <div className="py-2">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.status.includes(option.value)}
                  onChange={() => onStatusFilterChange(option.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </Dropdown>

        {/* Customer Filter */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
              <span className="text-gray-700">Kunde</span>
              {filters.customer.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                  {filters.customer.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
          }
          isOpen={isCustomerFilterOpen}
          onOpenChange={onCustomerFilterOpenChange}
          maxWidth="300px"
        >
          <div className="py-2 max-h-64 overflow-y-auto">
            {uniqueCustomers.map((customer) => (
              <label
                key={customer}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.customer.includes(customer)}
                  onChange={() => onCustomerFilterChange(customer)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                />
                <span className="text-sm text-gray-700">{customer}</span>
              </label>
            ))}
          </div>
        </Dropdown>

        {/* Due Date Filter */}
        <Dropdown
          trigger={
            <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">{getDueDateLabel()}</span>
              <ChevronDown className="h-4 w-4 text-gray-600" />
            </button>
          }
          isOpen={isDueDateFilterOpen}
          onOpenChange={onDueDateFilterOpenChange}
          maxWidth="200px"
        >
          <div className="py-2">
            {DUE_DATE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onDueDateFilterChange(option.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                  option.value === filters.dueDate ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Dropdown>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="secondary"
            onClick={onClearAllFilters}
            icon={X}
            className="text-sm h-10"
          >
            Zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}

export default MyTasksFilterBar;