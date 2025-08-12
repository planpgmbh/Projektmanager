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
  const [activeTab, setActiveTab] = useState<'start' | 'due'>('start');

  const handleSave = () => {
    onSave(selectedStartDate, selectedDueDate);
    onClose();
  };

  const handleDateChange = (date: Date | null) => {
    if (activeTab === 'start') {
      setSelectedStartDate(date);
    } else {
      setSelectedDueDate(date);
    }
  };

  const getSelectedDate = () => {
    return activeTab === 'start' ? selectedStartDate : selectedDueDate;
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
      <div className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('start')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              activeTab === 'start'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Startdatum
          </button>
          <button
            onClick={() => setActiveTab('due')}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              activeTab === 'due'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Fälligkeitsdatum
          </button>
        </div>

        {/* Date Picker */}
        <div className="flex justify-center">
          <DatePicker
            selected={getSelectedDate()}
            onChange={handleDateChange}
            inline
            dateFormat="dd.MM.yyyy"
            className="task-date-picker"
          />
        </div>

        {/* Clear Date Button */}
        <div className="flex justify-center">
          <button
            onClick={() => handleDateChange(null)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {activeTab === 'start' ? 'Startdatum entfernen' : 'Fälligkeitsdatum entfernen'}
          </button>
        </div>
      </div>
    </Popup>
  );
}

export default TaskDatePickerPopup;