import React, { useState, useEffect } from 'react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { SearchableSelect } from '../ui/SearchableSelect';

interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  priceItemId: string;
  hours: number;
  note: string;
  date: string;
  userId: string;
}

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

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
}

interface EditTimeEntryProjectCustomerPopupProps {
  timeEntry: TimeEntry;
  projects: Project[];
  allTasks: { [projectId: string]: Task[] };
  customers: Customer[];
  onClose: () => void;
  onSave: (entryId: string, updates: { projectId: string; taskId: string; priceItemId: string }) => Promise<void>;
}

function EditTimeEntryProjectCustomerPopup({
  timeEntry,
  projects,
  allTasks,
  customers,
  onClose,
  onSave
}: EditTimeEntryProjectCustomerPopupProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with current values
  useEffect(() => {
    const currentProject = projects.find(p => p.id === timeEntry.projectId);
    if (currentProject) {
      setSelectedCustomerId(currentProject.customerId);
      setSelectedProjectId(currentProject.id);
    }
  }, [timeEntry, projects]);

  // Get projects for selected customer
  const customerProjects = selectedCustomerId 
    ? projects.filter(p => p.customerId === selectedCustomerId && p.status === 'active')
    : [];

  // Get tasks for selected project
  const projectTasks = selectedProjectId ? (allTasks[selectedProjectId] || []) : [];

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedProjectId(''); // Reset project selection when customer changes
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleSave = async () => {
    if (!selectedProjectId) {
      setError('Bitte wählen Sie ein Projekt aus.');
      return;
    }

    // Find the first task in the selected project as default
    const firstTask = projectTasks[0];
    if (!firstTask) {
      setError('Das ausgewählte Projekt hat keine Aufgaben.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(timeEntry.id, {
        projectId: selectedProjectId,
        taskId: firstTask.id,
        priceItemId: '' // Reset price item selection
      });
      onClose();
    } catch (err) {
      console.error('Error updating time entry:', err);
      setError('Fehler beim Aktualisieren des Zeiteintrags');
    } finally {
      setIsLoading(false);
    }
  };

  const currentProject = projects.find(p => p.id === timeEntry.projectId);
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const hasChanges = selectedProjectId !== timeEntry.projectId;

  return (
    <Popup
      title="Kunde und Projekt ändern"
      onClose={onClose}
      footer={
        <PopupFooter>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            disabled={isLoading || !hasChanges || !selectedProjectId}
          >
            Ändern
          </Button>
        </PopupFooter>
      }
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Current Assignment Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Aktuelle Zuordnung</h3>
          <div className="text-sm text-gray-600">
            <div><strong>Kunde:</strong> {currentProject?.customerName || 'Unbekannt'}</div>
            <div><strong>Projekt:</strong> {currentProject?.name || 'Unbekannt'}</div>
          </div>
        </div>

        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Neuen Kunden auswählen
          </label>
          <SearchableSelect
            items={customers.map(c => ({ id: c.id, name: c.name }))}
            selectedId={selectedCustomerId}
            onSelect={handleCustomerSelect}
            placeholder="Kunde auswählen"
          />
        </div>

        {/* Project Selection - Only show when customer is selected */}
        {selectedCustomerId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projekt auswählen
            </label>
            {customerProjects.length > 0 ? (
              <SearchableSelect
                items={customerProjects.map(p => ({ id: p.id, name: p.name }))}
                selectedId={selectedProjectId}
                onSelect={handleProjectSelect}
                placeholder="Projekt auswählen"
              />
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md text-sm">
                Dieser Kunde hat keine aktiven Projekte.
              </div>
            )}
          </div>
        )}

        {/* Preview of changes */}
        {selectedProject && hasChanges && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Neue Zuordnung</h3>
            <div className="text-sm text-blue-800">
              <div><strong>Kunde:</strong> {selectedProject.customerName}</div>
              <div><strong>Projekt:</strong> {selectedProject.name}</div>
            </div>
            <div className="mt-2 text-xs text-blue-700">
              <strong>Hinweis:</strong> Die Aufgabe und Leistung werden zurückgesetzt und müssen neu ausgewählt werden.
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
}

export default EditTimeEntryProjectCustomerPopup;