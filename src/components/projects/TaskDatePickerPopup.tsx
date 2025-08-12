import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
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

  const handleSave = () => {
    onSave(selectedStartDate, selectedDueDate);
    onClose();
  };

  const handleDateChange = (dates: [Date | null, Date | null] | null) => {
    if (dates) {
      const [start, end] = dates;
      setSelectedStartDate(start);
      setSelectedDueDate(end);
    } else {
      setSelectedStartDate(null);
      setSelectedDueDate(null);
    }
  };

  const handleClearDates = () => {
    setSelectedStartDate(null);
    setSelectedDueDate(null);
  };

  const formatDateRange = () => {
    if (!selectedStartDate && !selectedDueDate) {
      return 'Termine festlegen';
    }
    
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short'
      }).format(date);
    };

    if (selectedStartDate && selectedDueDate) {
      return `${formatDate(selectedStartDate)} - ${formatDate(selectedDueDate)}`;
    } else if (selectedStartDate) {
      return `Ab ${formatDate(selectedStartDate)}`;
    } else if (selectedDueDate) {
      return `Bis ${formatDate(selectedDueDate)}`;
    }
    
    return 'Termine festlegen';
  };

  return (
    <Popup
      title={formatDateRange()}
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
        {/* Date Range Picker */}
        <div className="w-full flex justify-center">
          <DatePicker
            selected={selectedStartDate}
            onChange={handleDateChange}
            startDate={selectedStartDate}
            endDate={selectedDueDate}
            selectsRange
            inline
            dateFormat="dd.MM.yyyy"
            className="task-date-range-picker-modern"
            monthsShown={1}
          />
        </div>

        {/* Selected Range Display */}
        {(selectedStartDate || selectedDueDate) && (
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm font-medium text-gray-900 mb-2">Ausgewählter Zeitraum:</div>
            <div className="space-y-1 text-sm text-gray-700">
              {selectedStartDate && (
                <div>
                  <span className="font-medium">Startdatum:</span> {selectedStartDate.toLocaleDateString('de-DE')}
                </div>
              )}
              {selectedDueDate && (
                <div>
                  <span className="font-medium">Fälligkeitsdatum:</span> {selectedDueDate.toLocaleDateString('de-DE')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clear Dates Button */}
        <div className="flex justify-center">
          <button
            onClick={handleClearDates}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Termine entfernen
          </button>
        </div>
      </div>
    </Popup>
  );
}

export default TaskDatePickerPopup;