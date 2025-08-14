import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, PlayCircle, StopCircle, Clock, Home } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { useTimeEntries } from '../../hooks/useTimeEntries';
import { useProjectsData } from '../../hooks/useProjectsData';
import { usePriceItemsData } from '../../hooks/usePriceItemsData';
import { useInlineEdit } from '../../hooks/useInlineEdit';
import { useActiveTimer } from '../../hooks/useActiveTimer';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import AddTimeEntryPopup from './AddTimeEntryPopup';
import ItemActionsMenu from '../ui/ItemActionsMenu';
import { parseAndRoundTimeInput, formatTimeDisplay } from '../../utils/time';
import 'react-datepicker/dist/react-datepicker.css';

function TimeTrackingOverview() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAddingTimeEntry, setIsAddingTimeEntry] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({});

  // Custom hooks
  const {
    timeEntries,
    isLoading: timeEntriesLoading,
    error: timeEntriesError,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    duplicateTimeEntry,
    getEntriesForDate,
    getTotalHours,
    getWeeklyHours
  } = useTimeEntries();

  const {
    projects,
    userActiveProjects,
    allTasks,
    customerPricelists,
    isLoading: projectsLoading,
    error: projectsError,
    getProjectName,
    getCustomerName,
    getTaskName,
    getAvailablePriceItems,
    getPriceItemName
  } = useProjectsData();

  const {
    priceItems,
    isLoading: priceItemsLoading,
    error: priceItemsError
  } = usePriceItemsData();

  const {
    editingEntryId,
    editingField,
    editingValue,
    setEditingValue,
    startEditing,
    cancelEdit,
    isEditing
  } = useInlineEdit();

  const {
    startTimer,
    stopTimer,
    createTimerEntry,
    getCurrentDisplayTime
  } = useActiveTimer(timeEntries, updateTimeEntry);

  const isLoading = timeEntriesLoading || projectsLoading || priceItemsLoading;
  const error = timeEntriesError || projectsError || priceItemsError;

  // Get unique customers from projects
  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map();
    projects.forEach(project => {
      if (project.customerId && project.customerName) {
        customerMap.set(project.customerId, {
          id: project.customerId,
          name: project.customerName
        });
      }
    });
    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(selectedDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const totalHours = getTotalHours(date);

      weekDays.push({
        date,
        dayName: date.toLocaleDateString('de-DE', { weekday: 'short' }).charAt(0).toUpperCase(),
        totalHours,
        isSelected: date.toDateString() === selectedDate.toDateString()
      });
    }
    return weekDays;
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const selectWeekDay = (date: Date) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const handleDropdownOpenChange = (dropdownKey: string, isOpen: boolean) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownKey]: isOpen
    }));
  };

  const handleCustomerChange = async (entryId: string, newCustomerId: string) => {
    try {
      await updateTimeEntry(entryId, {
        projectId: '',
        taskId: '',
        priceItemId: ''
      });
      handleDropdownOpenChange(`customer-${entryId}`, false);
    } catch (err) {
      console.error('Error updating customer:', err);
    }
  };
  const handleProjectChange = async (entryId: string, newProjectId: string) => {
    try {
      await updateTimeEntry(entryId, {
        projectId: newProjectId,
        taskId: '',
        priceItemId: ''
      });
      handleDropdownOpenChange(`project-${entryId}`, false);
    } catch (err) {
      console.error('Error updating project:', err);
    }
  };

  const handleTaskChange = async (entryId: string, newTaskId: string) => {
    try {
      await updateTimeEntry(entryId, { taskId: newTaskId });
      handleDropdownOpenChange(`task-${entryId}`, false);
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handlePriceItemChange = async (entryId: string, newPriceItemId: string) => {
    try {
      await updateTimeEntry(entryId, { priceItemId: newPriceItemId });
      handleDropdownOpenChange(`priceItem-${entryId}`, false);
    } catch (err) {
      console.error('Error updating price item:', err);
    }
  };

  const saveEdit = async () => {
    if (!editingEntryId || !editingField) return;

    try {
      const updateData: any = {};

      if (editingField === 'hours') {
        // Parse und runde automatisch auf 15-Minuten-Schritte auf
        const hours = parseAndRoundTimeInput(editingValue);
        if (!isNaN(hours) && hours > 0) {
          updateData.hours = hours;
          console.log(`Manuelle Bearbeitung: ${editingValue} → ${hours.toFixed(4)}h (aufgerundet auf 15-Min-Schritte)`);
        } else {
          throw new Error('Bitte geben Sie eine gültige Zeit ein (z.B. 1:30, 1,5 oder 1.5).');
        }
      } else {
        updateData[editingField] = editingValue;
      }

      await updateTimeEntry(editingEntryId, updateData);
      cancelEdit();
    } catch (err) {
      console.error('Error updating time entry:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const handleAddTimeEntry = async (newEntry: Omit<any, 'id' | 'userId'>) => {
    try {
      console.log('📝 handleAddTimeEntry called with:', newEntry);
      await addTimeEntry(newEntry);
      console.log('✅ Time entry added successfully');
      setIsAddingTimeEntry(false);
    } catch (err) {
      console.error('❌ Error adding time entry:', err);
      // Don't close popup on error so user can retry
    }
  };

  const handleStartTimer = async (timerEntry: Omit<any, 'id' | 'userId' | 'hours'>) => {
    try {
      console.log('⏰ handleStartTimer called with:', timerEntry);
      await createTimerEntry(timerEntry, addTimeEntry);
      console.log('✅ Timer started successfully');
      setIsAddingTimeEntry(false);
    } catch (err) {
      console.error('❌ Error in handleStartTimer:', err);
      // Don't close popup on error so user can retry
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const weekDays = getWeekDays();

  return (
    <>
      <div className="bg-white rounded-lg shadow relative">
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {/* Header with Date, Today Button and Calendar Icon */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            {/* Today Button - Left side */}
            <button
              onClick={goToToday}
              disabled={isToday()}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                isToday() 
                  ? 'border-white text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
              }`}
              title="Zu heute springen"
            >
              <Home className="h-4 w-4" />
              <span>Heute</span>
            </button>

            {/* Date Title - Center */}
            <h2 className="text-base font-semibold text-black mr-[50px]">
              {formatDate(selectedDate)}
            </h2>

            {/* Calendar Icon - Right side */}
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Datum auswählen"
            >
              <Calendar className="h-4 w-5 text-gray-400" />
            </button>
            
            {showDatePicker && (
              <div className="absolute right-6 top-16 z-50">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date) => {
                    setSelectedDate(date);
                    setShowDatePicker(false);
                  }}
                  dateFormat="dd.MM.yyyy"
                  inline
                  className="shadow-lg border border-gray-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Week Navigation */}
        <div className="px-5 py-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDay('prev')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="flex items-center justify-between max-w-md w-full">
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => selectWeekDay(day.date)}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                    day.isSelected 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-400'
                  }`}>
                    <span className="text-xs font-bold">{day.dayName}</span>
                  </div>
                  <span className={`text-xs ${
                    day.isSelected 
                      ? 'text-black font-medium' 
                      : 'text-gray-400'
                  }`}>
                    {formatTimeDisplay(day.totalHours)}
                  </span>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => navigateDay('next')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Time Entries - 4 Equal Columns */}
        <div className="divide-y divide-gray-200 border-t border-gray-200">
          {getEntriesForDate(selectedDate).length > 0 ? (
            getEntriesForDate(selectedDate).map((entry) => (
              <div 
                key={entry.id} 
                className={`grid grid-cols-4 gap-4 px-5 py-4 transition-colors duration-150 group ${
                  entry.isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Spalte 1: Kunde (1/4) */}
                <div className="flex items-center">
                  <div className="text-sm font-semibold text-black">
                    <Dropdown
                      trigger={
                        <span className="cursor-pointer hover:text-blue-600">
                          {getCustomerName(entry.projectId)}
                        </span>
                      }
                      isOpen={openDropdowns[`customer-${entry.id}`] || false}
                      onOpenChange={(isOpen) => handleDropdownOpenChange(`customer-${entry.id}`, isOpen)}
                      minWidth="200px"
                      maxWidth="300px"
                    >
                      <div className="py-1">
                        {uniqueCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => handleCustomerChange(entry.id, customer.id)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                              customer.id === entry.projectId ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {customer.name}
                          </button>
                        ))}
                      </div>
                    </Dropdown>
                  </div>
                </div>

                {/* Spalte 2: Details (1/4) */}
                <div className="flex items-center">
                  <div className="space-y-1 w-full">
                    {/* Projekt */}
                    <div className="text-sm text-gray-900 font-semibold">
                      <Dropdown
                        trigger={
                          <span className="cursor-pointer hover:text-blue-600">
                            {getProjectName(entry.projectId)}
                          </span>
                        }
                        isOpen={openDropdowns[`project-${entry.id}`] || false}
                        onOpenChange={(isOpen) => handleDropdownOpenChange(`project-${entry.id}`, isOpen)}
                        minWidth="200px"
                        maxWidth="300px"
                      >
                        <div className="py-1">
                          {userActiveProjects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => handleProjectChange(entry.id, project.id)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                project.id === entry.projectId ? 'font-semibold text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {project.name}
                            </button>
                          ))}
                        </div>
                      </Dropdown>
                    </div>
                    
                    {/* Aufgabe */}
                    <div className="text-sm text-gray-900">
                      <Dropdown
                        trigger={
                          <span className="cursor-pointer hover:text-blue-600">
                            {getTaskName(entry.taskId, entry.projectId)}
                          </span>
                        }
                        isOpen={openDropdowns[`task-${entry.id}`] || false}
                        onOpenChange={(isOpen) => handleDropdownOpenChange(`task-${entry.id}`, isOpen)}
                        minWidth="200px"
                        maxWidth="300px"
                      >
                        <div className="py-1">
                          {(allTasks[entry.projectId] || []).map((task) => (
                            <button
                              key={task.id}
                              onClick={() => handleTaskChange(entry.id, task.id)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                task.id === entry.taskId ? 'font-semibold text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {task.name}
                            </button>
                          ))}
                        </div>
                      </Dropdown>
                    </div>
                    
                    {/* Leistung */}
                    <div className="text-sm text-gray-900">
                      <Dropdown
                        trigger={
                          <span className="cursor-pointer hover:text-blue-600">
                            {getPriceItemName(entry.priceItemId, entry.projectId, priceItems)}
                          </span>
                        }
                        isOpen={openDropdowns[`priceItem-${entry.id}`] || false}
                        onOpenChange={(isOpen) => handleDropdownOpenChange(`priceItem-${entry.id}`, isOpen)}
                        minWidth="200px"
                        maxWidth="300px"
                      >
                        <div className="py-1">
                          {getAvailablePriceItems(entry.projectId, priceItems).map((item) => (
                            <button
                              key={item.id}
                              onClick={() => handlePriceItemChange(entry.id, item.id)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                item.id === entry.priceItemId ? 'font-semibold text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                      </Dropdown>
                    </div>
                  </div>
                </div>

                {/* Spalte 3: Notiz (1/4) */}
                <div className="flex items-center">
                  <div className="text-sm text-gray-600 w-full">
                    {isEditing(entry.id, 'note') ? (
                      <textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => startEditing(entry.id, 'note', entry.note)}
                        className={`cursor-text hover:text-blue-600 block w-full ${
                          !entry.note ? 'text-gray-400' : ''
                        }`}
                      >
                        {entry.note || 'Notiz hinzufügen'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spalte 4: Zeit, Play-Icon, Aktionen (1/4) */}
                <div className="flex items-center justify-end gap-3">
                  {/* Zeit mit animiertem Icon - Fixed Container */}
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="text-lg font-medium text-gray-900 min-w-[80px] text-right">
                      {isEditing(entry.id, 'hours') ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={saveEdit}
                          onFocus={(e) => e.target.select()}
                          onKeyDown={handleKeyDown}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            if (!entry.isActive) {
                              startEditing(entry.id, 'hours', entry.hours.toString());
                            }
                          }}
                          className={`${!entry.isActive ? 'cursor-text hover:text-blue-600' : ''}`}
                        >
                          {formatTimeDisplay(getCurrentDisplayTime(entry))}
                        </span>
                      )}
                    </div>
                    
                    {/* Fixed Icon Container - Always 20px width */}
                    <div className="w-5 h-5 flex items-center justify-center relative">
                      {entry.isActive ? (
                        <>
                          {/* Animierte Uhr - standardmäßig sichtbar */}
                          <Clock className="h-5 w-5 text-blue-600 animate-spin group-hover:opacity-0 transition-opacity duration-200 absolute" />
                          
                          {/* Stop Icon - nur bei Hover sichtbar */}
                          <StopCircle 
                            className="h-5 w-5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer absolute"
                            onClick={() => stopTimer(entry.id)}
                          />
                        </>
                      ) : (
                        <PlayCircle 
                            className="h-5 w-5 text-gray-400 cursor-pointer hover:text-blue-700 transition-colors duration-200"

                          onClick={() => startTimer(entry.id)}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Aktionsmenü */}
                  <ItemActionsMenu
                    onDuplicate={() => duplicateTimeEntry(entry)}
                    onDelete={() => deleteTimeEntry(entry.id)}
                    deleteMessage="Möchten Sie diesen Zeiteintrag wirklich löschen?"
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              Keine Zeiteinträge für diesen Tag vorhanden
            </div>
          )}
          
          {/* Add Time Entry Button and Summary */}
          <div className="px-5 py-4 bg-gray-50 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsAddingTimeEntry(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Zeit hinzufügen</span>
              </button>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-black font-medium">
                  Tag: {formatTimeDisplay(getTotalHours(selectedDate))}
                </span>
                <span className="text-black font-medium">
                  Woche: {formatTimeDisplay(getWeeklyHours(selectedDate))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddingTimeEntry && (
        <AddTimeEntryPopup
          selectedDate={selectedDate}
          projects={projects}
          allTasks={allTasks}
          priceItems={priceItems}
          customerPricelists={customerPricelists}
          onClose={() => setIsAddingTimeEntry(false)}
          onSave={handleAddTimeEntry}
          onStartTimer={handleStartTimer}
        />
      )}
    </>
  );
}

export default TimeTrackingOverview;