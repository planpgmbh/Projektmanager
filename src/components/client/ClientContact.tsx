import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Popup, PopupFooter, PopupDangerButton } from '../ui/Popup';
import { Button } from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';

interface ClientContactProps {
  contactId: string;
  initialData: {
    contact: {
      id: string;
      gender?: string;
      title?: string;
      surename?: string;
      familyname?: string;
      customerNumber?: string;
      parent?: {
        name?: string;
      };
    };
  };
  onClose: () => void;
  onSaved?: () => void;
}

function ClientContact({ contactId, onClose, onSaved }: ClientContactProps) {
  const [activeTab, setActiveTab] = useState<'address' | 'contactDetails'>('address');
  const [contactData, setContactData] = useState<any>({});
  const [addressData, setAddressData] = useState({
    street: '',
    zip: '',
    city: '',
    country: { id: 55, objectName: 'StaticCountry' }
  });
  const [communicationData, setCommunicationData] = useState({
    phone: { id: '', value: '' },
    email: { id: '', value: '' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const contactResponse = await fetch(`/api/contact/${contactId}`);
        if (!contactResponse.ok) {
          throw new Error('Failed to fetch contact data');
        }
        const contactResult = await contactResponse.json();
        
        const contact = Array.isArray(contactResult.objects)
          ? contactResult.objects[0]
          : contactResult.objects || contactResult;
        
        setContactData({
          surename: contact?.surename || '',
          familyname: contact?.familyname || '',
          category: contact?.category || { id: '3', objectName: 'Category' }
        });

        const addressResponse = await fetch(`/api/contactAddress/${contactId}`);
        if (addressResponse.ok) {
          const addressResult = await addressResponse.json();
          if (addressResult.objects && addressResult.objects.length > 0) {
            setAddressData(addressResult.objects[0]);
          }
        }

        const commResponse = await fetch(`/api/communicationWay/${contactId}`);
        if (commResponse.ok) {
          const commResult = await commResponse.json();

          const commData = {
            phone: { id: '', value: '' },
            email: { id: '', value: '' }
          };

          (commResult.objects || []).forEach((comm: any) => {
            const type =
              typeof comm.type === 'string'
                ? comm.type
                : comm.type?.type || comm.type?.key || '';

            if (type === 'PHONE') {
              commData.phone = { id: comm.id || '', value: comm.value };
            } else if (type === 'EMAIL') {
              commData.email = { id: comm.id || '', value: comm.value };
            }
          });

          setCommunicationData(commData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load contact data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [contactId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCommunicationChange = (type: 'phone' | 'email', value: string) => {
    setCommunicationData(prev => ({
      ...prev,
      [type]: { ...prev[type], value }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const contactPayload = {
        id: contactId,
        objectName: 'Contact',
        surename: contactData.surename || '',
        familyname: contactData.familyname || '',
        category: { 
          id: contactData.category?.id || '3',
          objectName: 'Category'
        }
      };

      const contactResponse = await fetch(`/api/contact/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactPayload)
      });

      if (!contactResponse.ok) {
        const errorText = await contactResponse.text();
        console.error('Error updating contact:', errorText);
        throw new Error('Failed to update contact');
      }

      if (addressData.street || addressData.zip || addressData.city) {
        const { id, street, zip, city, country } = addressData;

        const addressPayload = {
          id,
          street,
          zip,
          city,
          country: {
            id: country?.id || 1,
            objectName: 'StaticCountry'
          },
          contact: {
            id: contactId,
            objectName: 'Contact'
          },
          objectName: 'ContactAddress'
        };

        const addressMethod = addressData.id ? 'PUT' : 'POST';
        const addressUrl = addressData.id 
          ? `/api/contactAddress/${addressData.id}`
          : '/api/contactAddress';

        const addressResponse = await fetch(addressUrl, {
          method: addressMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressPayload)
        });

        if (!addressResponse.ok) {
          const errorText = await addressResponse.text();
          console.error('Error updating address:', errorText);
          throw new Error('Failed to update address');
        }
      }

      for (const [type, data] of Object.entries(communicationData)) {
        if (data.value) {
          const commPayload = {
            id: data.id,
            type: type.toUpperCase(),
            value: data.value,
            key: { id: '2', objectName: 'CommunicationWayKey' },
            contact: { id: contactId, objectName: 'Contact' },
            objectName: 'CommunicationWay'
          };

          const commMethod = data.id ? 'PUT' : 'POST';
          const commUrl = data.id 
            ? `/api/communicationWay/${data.id}`
            : '/api/communicationWay';

          const commResponse = await fetch(commUrl, {
            method: commMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commPayload)
          });

          if (!commResponse.ok) {
            const errorText = await commResponse.text();
            console.error(`Error updating ${type}:`, errorText);
            throw new Error(`Failed to update ${type}`);
          }
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/contact/${contactId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Popup
        title={
          <div className="flex items-center justify-between w-full">
            <span>Person bearbeiten</span>
            <a
              href={`https://my.sevdesk.de/crm/detail/id/${contactId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
              title="In sevDesk öffnen"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        }
        onClose={onClose}
        footer={
          <PopupFooter>
            <PopupDangerButton
              onClick={() => setShowDeleteConfirm(true)}
              isLoading={isDeleting}
            >
              Löschen
            </PopupDangerButton>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving || !contactData.familyname || isDeleting}
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

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
            <input
              type="text"
              name="surename"
              value={contactData.surename || ""}
              onChange={handleInputChange}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nachname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="familyname"
              value={contactData.familyname || ""}
              onChange={handleInputChange}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="border-b border-gray-200 mt-8">
          <nav className="-mb-px flex">
            <button
              className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'address'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('address')}
            >
              Adresse
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contactDetails'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('contactDetails')}
            >
              Kontaktdetails
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Straße & Hausnummer
                </label>
                <input
                  type="text"
                  name="street"
                  value={addressData.street || ''}
                  onChange={handleAddressChange}
                  onFocus={(e) => e.target.select()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={addressData.zip || ''}
                    onChange={handleAddressChange}
                    onFocus={(e) => e.target.select()}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={addressData.city || ''}
                    onChange={handleAddressChange}
                    onFocus={(e) => e.target.select()}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contactDetails' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={communicationData.phone.value}
                  onChange={(e) => handleCommunicationChange('phone', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={communicationData.email.value}
                  onChange={(e) => handleCommunicationChange('email', e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>
      </Popup>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Kontakt löschen"
        message="Möchten Sie diesen Kontakt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

export default ClientContact;