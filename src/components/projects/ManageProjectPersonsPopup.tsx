import React, { useState } from 'react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { Project, User } from './ProjectDetailsTabTasks_Types';
import { createProjectAssignmentNotification, createProjectRemovalNotification } from '../../utils/notifications';
import { useAuthState } from '../../hooks/useAuthState';

interface ManageProjectPersonsPopupProps {
  project: Project;
  allUsers: User[];
  onClose: () => void;
  onSave: (updatedInvolvedUserIds: string[], updatedPMUserIds: string[]) => Promise<void>;
}

function ManageProjectPersonsPopup({
  project,
  allUsers,
  onClose,
  onSave
}: ManageProjectPersonsPopupProps) {
  const { user } = useAuthState();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    project.involvedUserIds || []
  );
  const [selectedPMUserIds, setSelectedPMUserIds] = useState<string[]>(
    project.PMUserIDs || []
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleUserToggle = (userId: string) => {
    const newSelectedUserIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];
    
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
    
    // If user is removed from involved, also remove from PM
    if (!newSelectedUserIds.includes(userId)) {
      setSelectedPMUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const handlePMToggle = (userId: string) => {
    const isPMSelected = selectedPMUserIds.includes(userId);
    
    if (isPMSelected) {
      // Remove from PM list
      setSelectedPMUserIds(prev => prev.filter(id => id !== userId));
    } else {
      // Add to PM list and ensure user is also involved
      setSelectedPMUserIds(prev => [...prev, userId]);
      if (!selectedUserIds.includes(userId)) {
        setSelectedUserIds(prev => [...prev, userId]);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const currentUserIds = project.involvedUserIds || [];
      const addedUserIds = selectedUserIds.filter(id => !currentUserIds.includes(id));
      const removedUserIds = currentUserIds.filter(id => !selectedUserIds.includes(id));

      // Save the changes first
      await onSave(selectedUserIds, selectedPMUserIds);

      // Create notifications for added users
      if (user && addedUserIds.length > 0) {
        const senderUserId = user.uid;
        
        for (const userId of addedUserIds) {
          await createProjectAssignmentNotification(
            userId,
            senderUserId,
            project.customerName,
            project.name,
            project.id
          );
        }
      }

      // Create notifications for removed users
      if (user && removedUserIds.length > 0) {
        const senderUserId = user.uid;
        
        for (const userId of removedUserIds) {
          await createProjectRemovalNotification(
            userId,
            senderUserId,
            project.customerName,
            project.name,
            project.id
          );
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving involved persons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    const currentIds = project.involvedUserIds || [];
    const currentPMIds = project.PMUserIDs || [];
    return JSON.stringify(selectedUserIds.sort()) !== JSON.stringify(currentIds.sort()) ||
           JSON.stringify(selectedPMUserIds.sort()) !== JSON.stringify(currentPMIds.sort());
  };

  // Filter out inactive users and sort by role and name
  const activeUsers = allUsers
    .filter(user => user.role !== 'inaktiv')
    .sort((a, b) => {
      // Sort by role first (admin, projektmanager, nutzer, buchhaltung)
      const roleOrder = { admin: 0, projektmanager: 1, nutzer: 2, buchhaltung: 3 };
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 999;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 999;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Then sort by name
      const aName = `${a.firstName} ${a.lastName}`.trim();
      const bName = `${b.firstName} ${b.lastName}`.trim();
      return aName.localeCompare(bName);
    });

  return (
    <Popup
      title="Beteiligte Personen verwalten"
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
            disabled={isLoading || !hasChanges()}
          >
            Speichern
          </Button>
        </PopupFooter>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          Wählen Sie die Personen aus, die an diesem Projekt beteiligt sind:
        </div>

        {/* Scrollable user list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {activeUsers.length > 0 ? (
            activeUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.email}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
                
                <div className="flex items-center space-x-6">
                  {/* Beteiligt Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`involved-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`involved-${user.id}`} className="text-sm text-gray-700 cursor-pointer">
                      Beteiligt
                    </label>
                  </div>
                  
                  {/* Projektmanager Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`pm-${user.id}`}
                      checked={selectedPMUserIds.includes(user.id)}
                      onChange={() => handlePMToggle(user.id)}
                      disabled={!selectedUserIds.includes(user.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label htmlFor={`pm-${user.id}`} className={`text-sm cursor-pointer ${
                      selectedUserIds.includes(user.id) ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      Projektmanager
                    </label>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              Keine aktiven Benutzer verfügbar
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
}

export default ManageProjectPersonsPopup;