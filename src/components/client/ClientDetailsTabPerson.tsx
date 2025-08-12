import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Contact } from '../../types';
import ItemActionsMenu from '../ui/ItemActionsMenu';
import ClientContact from './ClientContact';

interface ClientDetailsTabPersonProps {
  selectedOrganization: Contact;
  onAddPerson: () => void;
}

function ClientDetailsTabPerson({ selectedOrganization, onAddPerson }: ClientDetailsTabPersonProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchPersons = async () => {
    if (!selectedOrganization?.id) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/organization/${selectedOrganization.id}/persons`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data || !data.objects) {
        console.warn('Unexpected response format:', data);
        throw new Error('Invalid response format from server');
      }

      const organizations = data.objects.filter((contact: any) => 
        contact.category?.id === '3' || contact.category?.id === 3
      );
      setContacts(organizations);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching persons:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, [selectedOrganization?.id, refreshTrigger]);

  const handleContactClick = (e: React.MouseEvent, contactId: string) => {
    // Only open the edit dialog if the click didn't come from the action buttons
    if (!(e.target as HTMLElement).closest('.action-buttons')) {
      setSelectedContactId(contactId);
    }
  };

  const handleContactClose = () => {
    setSelectedContactId(null);
  };

  const handleContactDeleted = async (contactId: string) => {
    try {
      const response = await fetch(`/api/contact/${contactId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact');
    }
  };

  const handleContactSaved = async () => {
    setRefreshTrigger(prev => prev + 1);
    handleContactClose();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Personen</h3>
        <button
          onClick={onAddPerson}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-5 w-5 mr-1" />
          Person hinzufügen
        </button>
      </div>

      {loading && <p className="text-gray-500">Lade Personen…</p>}
      {error && <p className="text-red-500">❌ {error}</p>}
      {!loading && contacts.length === 0 && !error && (
        <p className="text-gray-500">Keine Personen vorhanden.</p>
      )}

      <div className="space-y-4">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="relative border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
            onClick={(e) => handleContactClick(e, contact.id)}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {contact.surename} {contact.familyname}
              </h4>
              <div className="action-buttons">
                <ItemActionsMenu
                  onEdit={() => setSelectedContactId(contact.id)}
                  onDelete={() => handleContactDeleted(contact.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedContactId && (
        <ClientContact
          contactId={selectedContactId}
          initialData={{
            contact: contacts.find(c => c.id === selectedContactId) || {
              id: selectedContactId,
              gender: '',
              title: '',
              surename: '',
              familyname: '',
              customerNumber: '',
              parent: { name: '' }
            }
          }}
          onClose={handleContactClose}
          onSaved={handleContactSaved}
        />
      )}
    </div>
  );
}

export default ClientDetailsTabPerson;