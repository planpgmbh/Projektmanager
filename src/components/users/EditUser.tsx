import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserRole } from '../../hooks/useUserRole';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';

interface EditUserProps {
  user: {
    id: string;
    email: string;
    role: UserRole;
    firstName?: string;
    lastName?: string;
  };
  onClose: () => void;
}

function EditUser({ user, onClose }: EditUserProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles: UserRole[] = ['admin', 'projektmanager', 'nutzer', 'buchhaltung', 'inaktiv'];

  const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    projektmanager: 'Projektmanager',
    nutzer: 'Nutzer',
    buchhaltung: 'Buchhaltung',
    inaktiv: 'Inaktiv'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    setIsRoleDropdownOpen(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role
      });
      onClose();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Fehler beim Speichern der Änderungen');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = () => {
    return formData.firstName !== user.firstName ||
           formData.lastName !== user.lastName ||
           formData.role !== user.role;
  };

  return (
    <Popup
      title="Benutzer bearbeiten"
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
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vorname
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rolle
            </label>
            <Dropdown
              trigger={
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white">
                  {roleLabels[formData.role]}
                </div>
              }
              isOpen={isRoleDropdownOpen}
              onOpenChange={setIsRoleDropdownOpen}
            >
              <div className="py-1">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                      role === formData.role ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Die Projektzuweisung erfolgt jetzt direkt über die jeweiligen Projektseiten. 
            Öffnen Sie ein Projekt und verwenden Sie die Funktion "Beteiligte Personen verwalten", um Benutzer zu Projekten hinzuzufügen oder zu entfernen.
          </div>
        </div>
      </div>
    </Popup>
  );
}

export default EditUser;