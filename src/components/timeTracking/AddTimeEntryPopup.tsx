import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, Clock } from 'lucide-react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { SearchableSelect } from '../ui/SearchableSelect';
import { parseAndRoundTimeInput } from '../../utils/time';
import { useAuthState } from '../../hooks/useAuthState';
import 'react-datepicker/dist/react-datepicker.css';

interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  status: string;
  involvedUserIds?: string[];
}

interface Task {
  id: string;
  name: string;
  sectionId: string;
}

interface PriceItem {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
}

interface TimeEntry {
  projectId: string;
  taskId: string;
  priceItemId: string;
  hours: number;
  note: string;
  date: string;
}

interface AddTimeEntryPopupProps {
  selectedDate: Date;
  projects: Project[];
  allTasks: { [projectId: string]: Task[] };
  priceItems: PriceItem[];
  customerPricelists: { [customerId: string]: PriceItem[] };
  onClose: () => void;
  onSave: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
  onStartTimer: (entry: Omit<TimeEntry, 'id' | 'hours'>) => Promise<void>;
}

function AddTimeEntryPopup({
  selectedDate,
  projects,
  allTasks,
  priceItems,
  customerPricelists,
  onClose,
  onSave,
  onStartTimer
}: AddTimeEntryPopupProps) {
  const { user } = useAuthState();
  const [entryDate, setEntryDate] = useState(selectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    priceItemId: '',
    note: '',
    hours: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter projects to only show those where the current user is involved AND status is active
  const userProjects = React.useMemo(() => {
    if (!user) {
      return [];
    }

    const filtered = projects.filter(project => {
      // Check if involvedUserIds exists and is an array
      if (!project.involvedUserIds || !Array.isArray(project.involvedUserIds)) {
        return false;
      }

      // Check if current user is in the involvedUserIds array
      const isInvolved = project.involvedUserIds.includes(user.uid);
      
      // Check if project status is active
      const isActive = project.status === 'active';
      
      return isInvolved && isActive;
    });

    return filtered;
  }, [projects, user]);

  const selectedProject = userProjects.find(p => p.id === formData.projectId);
  const availableTasks = formData.projectId ? (allTasks[formData.projectId] || []) : [];
  
  const availablePriceItems = selectedProject && customerPricelists[selectedProject.customerId] 
    ? customerPricelists[selectedProject.customerId] 
    : priceItems;

  const formatDateForTitle = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectSelect = (projectId: string) => {
    setFormData(prev => ({
      ...prev,
      projectId,
      taskId: '',
      priceItemId: ''
    }));
  };

  const handleTaskSelect = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      taskId,
      priceItemId: ''
    }));
  };

  const handlePriceItemSelect = (priceItemId: string) => {
    setFormData(prev => ({
      ...prev,
      priceItemId
    }));
  };

  const handleSave = async () => {
    setError(null);

    if (!formData.projectId || !formData.taskId || !formData.priceItemId || !formData.hours) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    // Parse und runde automatisch auf 15-Minuten-Schritte auf
    const hours = parseAndRoundTimeInput(formData.hours);
    if (isNaN(hours) || hours <= 0) {
      setError('Bitte geben Sie eine gültige Zeit ein (z.B. 1:30, 1,5 oder 1.5).');
      return;
    }

    setIsLoading(true);

    try {
      const newEntry: Omit<TimeEntry, 'id'> = {
        projectId: formData.projectId,
        taskId: formData.taskId,
        priceItemId: formData.priceItemId,
        hours,
        note: formData.note,
        date: entryDate.toISOString().split('T')[0]
      };

      console.log('Saving time entry with rounded hours:', newEntry);
      await onSave(newEntry);
      onClose();
    } catch (err) {
      console.error('Error saving time entry:', err);
      setError('Fehler beim Speichern des Zeiteintrags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = async () => {
    setError(null);

    if (!formData.projectId || !formData.taskId || !formData.priceItemId) {
      setError('Bitte wählen Sie Projekt, Aufgabe und Leistung aus.');
      return;
    }

    setIsLoading(true);

    try {
      const timerEntry = {
        projectId: formData.projectId,
        taskId: formData.taskId,
        priceItemId: formData.priceItemId,
        note: formData.note,
        date: entryDate.toISOString().split('T')[0]
      };

      console.log('Starting timer with entry data:', timerEntry);
      await onStartTimer(timerEntry);
      onClose();
    } catch (err) {
      console.error('Error starting timer:', err);
      setError('Fehler beim Starten des Timers');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which step we're on
  const showTaskField = !!formData.projectId;
  const showPriceItemField = !!formData.taskId;
  const showTimeFields = !!formData.priceItemId;

  return (
    <Popup
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Datum ändern"
              >
                <Calendar className="h-5 w-5 text-gray-600" />
              </button>
              
              {showDatePicker && (
                <div className="absolute left-0 mt-2 z-50">
                  <DatePicker
                    selected={entryDate}
                    onChange={(date: Date) => {
                      setEntryDate(date);
                      setShowDatePicker(false);
                    }}
                    dateFormat="dd.MM.yyyy"
                    inline
                    className="shadow-lg border border-gray-200 rounded-lg"
                  />
                </div>
              )}
            </div>
            <span>Zeit für den {formatDateForTitle(entryDate)} hinzufügen</span>
          </div>
        </div>
      }
      onClose={onClose}
      footer={
        showTimeFields && (
          <PopupFooter>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              variant="secondary"
              icon={Clock}
              onClick={handleStartTimer}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Timer starten
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Zeit hinzufügen
            </Button>
          </PopupFooter>
        )
      }
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Scrollable content area */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {/* Step 1: Project Selection */}
        <div>
          {userProjects.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md">
              <p className="text-sm">
                <strong>Keine aktiven Projekte verfügbar.</strong><br />
                Sie sind derzeit keinem aktiven Projekt zugewiesen. Wenden Sie sich an einen Projektmanager, um zu aktiven Projekten hinzugefügt zu werden.
              </p>
            </div>
          ) : (
            <SearchableSelect
              items={userProjects.map(p => ({ id: p.id, name: `${p.name} (${p.customerName})` }))}
              selectedId={formData.projectId}
              onSelect={handleProjectSelect}
              placeholder="Projekt auswählen"
            />
          )}
        </div>

        {/* Step 2: Task Selection - Only show after project is selected */}
        {showTaskField && (
          <div>
            <SearchableSelect
              items={availableTasks.map(t => ({ id: t.id, name: t.name }))}
              selectedId={formData.taskId}
              onSelect={handleTaskSelect}
              placeholder="Aufgabe auswählen"
            />
          </div>
        )}

        {/* Step 3: Price Item Selection - Only show after task is selected */}
        {showPriceItemField && (
          <div>
            <SearchableSelect
              items={availablePriceItems.map(p => ({ id: p.id, name: p.name }))}
              selectedId={formData.priceItemId}
              onSelect={handlePriceItemSelect}
              placeholder="Leistung auswählen"
            />
          </div>
        )}

        {/* Step 4: Time Entry Fields - Only show after all selections are made */}
        {showTimeFields && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <textarea
                  name="note"
                  value={formData.note}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  style={{ height: '75px' }}
                  placeholder="Notizen (optional)"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  onFocus={(e) => e.target.select()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  style={{ fontSize: '35px', height: '75px' }}
                  placeholder="0:00"
                />
              </div>
            </div>
            
            {/* Hinweis zur automatischen Aufrundung */}
            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-md p-2">
              <strong>Hinweis:</strong> Zeiten werden automatisch auf das nächste 15-Minuten-Intervall aufgerundet.
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
}

export default AddTimeEntryPopup;