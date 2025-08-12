import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { X } from 'lucide-react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import 'react-datepicker/dist/react-datepicker.css';

interface TaskDatePickerPopupProps {
  initialStartDate: string;
  initialDueDate: string;
  onSave: (startDate: Date | null, dueDate: Date | null) => void;
  onClose: () => void;
}

function TaskDatePickerPopup({
  initialStartDate,
  initialDueDate,
  onSave,
  onClose
}: TaskDatePickerPopupProps) {
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [selectedDueDate, setSelectedDueDate] = useState<Date | null>(
    initialDueDate ? new Date(initialDueDate) : null
  );
  const [focusedInput, setFocusedInput] = useState<'start' | 'end' | null>('start');

  const handleSave = () => {
    onSave(selectedStartDate, selectedDueDate);
    onClose();
  };

  const handleDateChange = (dates: [Date | null, Date | null] | null) => {
    if (dates) {
      const [start, end] = dates;
      setSelectedStartDate(start);
      setSelectedDueDate(end);
      
      // Auto-focus logic: if start is selected but no end, focus end input
      if (start && !end) {
        setFocusedInput('end');
      }
    } else {
      setSelectedStartDate(null);
      setSelectedDueDate(null);
      setFocusedInput('start');
    }
  };

  const handleClearDates = () => {
    setSelectedStartDate(null);
    setSelectedDueDate(null);
    setFocusedInput('start');
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  };

  const handleStartInputClick = () => {
    setFocusedInput('start');
  };

  const handleEndInputClick = () => {
    setFocusedInput('end');
  };

  const clearStartDate = () => {
    setSelectedStartDate(null);
    setFocusedInput('start');
  };

  const clearEndDate = () => {
    setSelectedDueDate(null);
    setFocusedInput('end');
  };

  return (
    <Popup
      title="Termine festlegen"
      onClose={onClose}
      maxWidth="md"
      footer={
        <PopupFooter>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Speichern
          </Button>
        </PopupFooter>
      }
    >
      <div className="space-y-6">
        {/* Date Input Fields */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Startdatum
            </label>
            <div 
              className={`relative border rounded-lg px-3 py-3 cursor-pointer transition-all duration-200 ${
                focusedInput === 'start' 
                  ? 'border-gray-900 ring-1 ring-gray-900' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={handleStartInputClick}
            >
              <div className="text-sm text-gray-900">
                {selectedStartDate ? formatDateForInput(selectedStartDate) : '13/08/25'}
              </div>
              {selectedStartDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearStartDate();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* End Date Input */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enddatum
            </label>
            <div 
              className={`relative border rounded-lg px-3 py-3 cursor-pointer transition-all duration-200 ${
                focusedInput === 'end' 
                  ? 'border-gray-900 ring-1 ring-gray-900' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={handleEndInputClick}
            >
              <div className="text-sm text-gray-900">
                {selectedDueDate ? formatDateForInput(selectedDueDate) : '17/08/25'}
              </div>
              {selectedDueDate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearEndDate();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex justify-center">
          <DatePicker
            selected={selectedStartDate}
            onChange={handleDateChange}
            startDate={selectedStartDate}
            endDate={selectedDueDate}
            selectsRange
            inline
            dateFormat="dd.MM.yyyy"
            className="airbnb-date-picker"
            monthsShown={1}
            showPopperArrow={false}
          />
        </div>

        {/* Clear All Button */}
        {(selectedStartDate || selectedDueDate) && (
          <div className="flex justify-center">
            <button
              onClick={handleClearDates}
              className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors duration-150"
            >
              Termine entfernen
            </button>
          </div>
        )}
      </div>
    </Popup>
  );
}

export default TaskDatePickerPopup;