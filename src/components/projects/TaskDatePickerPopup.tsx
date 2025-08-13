import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';

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
  const [viewDate, setViewDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    initialDueDate ? new Date(initialDueDate) : null
  );
  const [selectingStart, setSelectingStart] = useState(false);
  const dueDateInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus due date input if no date is selected
  useEffect(() => {
    if (!initialStartDate && !initialDueDate && dueDateInputRef.current) {
      dueDateInputRef.current.focus();
    }
    // Ensure we start with due date selection
    setSelectingStart(false);
  }, [initialStartDate, initialDueDate]);

  const DOW = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // Helper functions
  const startOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  const endOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  const addDays = (date: Date, delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    const dateA = new Date(a);
    const dateB = new Date(b);
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);
    return dateA.getTime() === dateB.getTime();
  };

  const isBetween = (date: Date, start: Date, end: Date) => {
    const d = new Date(date).setHours(0, 0, 0, 0);
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);
    return (d >= s && d <= e) || (d >= e && d <= s);
  };

  const formatMonthLabel = (date: Date) => {
    const fmt = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });
    const str = fmt.format(date);
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const toUserStr = (date: Date | null) => {
    if (!date) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };

  const parseUserStr = (str: string): Date | null => {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(str.trim());
    if (!m) return null;
    const [_, d, mth, yy] = m;
    const day = parseInt(d, 10);
    const mon = parseInt(mth, 10);
    const year = 2000 + parseInt(yy, 10);
    if (mon < 1 || mon > 12) return null;
    const maxDay = new Date(year, mon, 0).getDate();
    if (day < 1 || day > maxDay) return null;
    return new Date(year, mon - 1, day);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const first = startOfMonth(viewDate);
    const jsDow = first.getDay();
    const mondayIndex = jsDow === 0 ? 7 : jsDow;
    const leading = mondayIndex - 1;
    const start = addDays(first, -leading);
    const total = 6 * 7;

    const days = [];
    for (let i = 0; i < total; i++) {
      const d = addDays(start, i);
      const isMuted = d.getMonth() !== viewDate.getMonth();
      const isStart = startDate && isSameDay(d, startDate);
      const isDue = dueDate && isSameDay(d, dueDate);
      
      // Determine styling based on date status
      let classes = 'aspect-square flex items-center justify-center cursor-pointer text-sm transition-colors duration-150';
      
      // Check for date range (highest priority)
      if (startDate && dueDate && !isSameDay(startDate, dueDate) && isBetween(d, startDate, dueDate)) {
        if (isStart) {
          classes += ' bg-blue-600 text-white rounded-l-full rounded-r-none hover:bg-blue-700';
        } else if (isDue) {
          classes += ' bg-blue-600 text-white rounded-r-full rounded-l-none hover:bg-blue-700';
        } else {
          classes += ' bg-blue-600 text-white rounded-none hover:bg-blue-700';
        }
      }
      // Check for single date selection
      else if (isStart || isDue) {
        classes += ' bg-blue-600 text-white rounded-full hover:bg-blue-700';
      }
      // Default styling
      else {
        classes += isMuted ? ' text-gray-400 hover:bg-gray-100' : ' text-gray-900 hover:bg-gray-100';
      }

      days.push({
        date: d,
        day: d.getDate(),
        classes
      });
    }

    return days;
  };

  const handleDayClick = (clickedDate: Date) => {
    // Wenn Start- und Enddatum gleich sind, wird die Auswahl zurückgesetzt
    if (startDate && dueDate && isSameDay(startDate, dueDate)) {
      setStartDate(null);
      setDueDate(null);
      setSelectingStart(false); // Beginne erneut mit der Auswahl des Fälligkeitsdatums
      return;
    }

    if (!selectingStart) {
      // Wir wählen das Fälligkeitsdatum aus
      setDueDate(clickedDate);
      if (!startDate) {
        setSelectingStart(true); // Nächster Klick ist für das Startdatum
      } else {
        setSelectingStart(false); // Auswahl abgeschlossen, nächste Auswahl beginnt wieder mit Fälligkeitsdatum
      }
    } else {
      // Wir wählen das Startdatum aus
      setStartDate(clickedDate);
      setSelectingStart(false); // Auswahl abgeschlossen, nächste Auswahl beginnt wieder mit Fälligkeitsdatum
    }
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = parseUserStr(e.target.value);
    if (d) {
      setStartDate(d);
      setSelectingStart(false); // Nächster Klick im Kalender soll Fälligkeitsdatum befüllen
    }
  };

  const handleDueInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = parseUserStr(e.target.value);
    if (d) {
      setDueDate(d);
      if (!startDate) {
        setSelectingStart(true); // Nächster Klick im Kalender soll Startdatum befüllen
      } else {
        setSelectingStart(false); // Startdatum bereits gesetzt, nächster Klick soll wieder Fälligkeitsdatum befüllen
      }
    }
  };

  const handleStartInputFocus = () => {
    setSelectingStart(true);
  };

  const handleDueInputFocus = () => {
    setSelectingStart(false);
  };

  const handleClearStart = () => {
    setStartDate(null);
    setSelectingStart(false);
  };

  const handleClearDue = () => {
    setDueDate(null);
    setSelectingStart(false); // Nächster Klick soll wieder Fälligkeitsdatum befüllen
  };

  const handleClearAll = () => {
    setStartDate(null);
    setDueDate(null);
    setSelectingStart(false); // Nächster Klick soll Fälligkeitsdatum befüllen
  };

  const handleSave = () => {
    onSave(startDate, dueDate);
    onClose();
  };

  const calendarDays = generateCalendarDays();

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
      <div className="mx-auto max-w-[320px]">
        {/* Date Input Fields */}
        <div className="flex justify-between items-center gap-4 mb-4">
          {/* Start Date Input */}
          <div className="relative w-[170px]">
            <input
              type="text"
              value={toUserStr(startDate)}
              onChange={handleStartInputChange}
              onFocus={handleStartInputFocus}
              placeholder="+ Startdatum"
              className={`w-full h-8 px-3 pr-8 text-sm font-medium rounded-md bg-white text-gray-600 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                startDate ? 'border border-gray-300' : 'border-none'
              }`}
            />
            {startDate && (
              <button
                onClick={handleClearStart}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm leading-none"
                type="button"
              >
                ×
              </button>
            )}
          </div>

          {/* Due Date Input */}
          <div className="relative w-[170px]">
            <input
              ref={dueDateInputRef}
              type="text"
              value={toUserStr(dueDate)}
              onChange={handleDueInputChange}
              onFocus={handleDueInputFocus}
              placeholder="Fälligkeitsdatum"
              className={`w-full h-8 px-3 pr-8 text-sm font-medium rounded-md bg-white text-gray-600 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                dueDate ? 'border border-gray-300' : 'border-none'
              }`}
            />
            {dueDate && (
              <button
                onClick={handleClearDue}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm leading-none"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={handlePrevMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
            type="button"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-700" strokeWidth={2} />
          </button>
          <div className="text-sm font-semibold text-gray-900">
            {formatMonthLabel(viewDate)}
          </div>
          <button
            onClick={handleNextMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
            type="button"
          >
            <ChevronRight className="h-3.5 w-3.5 text-gray-700" strokeWidth={2} />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-0 mb-1">
          {DOW.map((day) => (
            <div key={day} className="text-center text-xs text-gray-600 py-1.5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2 mb-4">
          {calendarDays.map((dayInfo, index) => (
            <button
              key={index}
              className={dayInfo.classes}
              onClick={() => handleDayClick(dayInfo.date)}
              type="button"
            >
              {dayInfo.day}
            </button>
          ))}
        </div>

        {/* Clear Values Button */}
        <div className="flex justify-end">
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors"
            type="button"
          >
            Werte löschen
          </button>
        </div>
      </div>
    </Popup>
  );
}

export default TaskDatePickerPopup;