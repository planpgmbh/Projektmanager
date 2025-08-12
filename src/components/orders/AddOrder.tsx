import React, { useState, useEffect } from 'react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { SearchBar } from '../ui/SearchBar';
import { Dropdown } from '../ui/Dropdown';

interface AddOrderProps {
  onClose: () => void;
  onSave: () => void;
  organizationId?: string;
}

interface Organization {
  id: string;
  name: string;
}

function AddOrder({ onClose, onSave, organizationId }: AddOrderProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>(organizationId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) throw new Error(`Fehler: ${response.status}`);
        const data = await response.json();

        const orgs = (data.objects || []).filter((contact: any) =>
          contact.category?.id === '3' || contact.category?.id === 3
        ).map((org: any) => ({
          id: org.id,
          name: org.name
        }));

        setOrganizations(orgs);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Fehler beim Laden der Organisationen');
      }
    };

    fetchOrganizations();
  }, []);

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOrgName = organizations.find(org => org.id === selectedOrganization)?.name || '';

  const handleCreateOrder = async () => {
    if (!selectedOrganization) {
      setError('Bitte wählen Sie eine Organisation aus');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const orderData = {
        contact: {
          id: selectedOrganization,
          objectName: 'Contact'
        },
        orderDate: new Date().toISOString().split('T')[0],
        status: '100',
        currency: 'EUR',
        smallSettlement: false,
        showNet: true,
        header: 'Neues Angebot'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || 'Unbekannter Fehler beim Erstellen des Angebots';
        throw new Error(errorMessage);
      }

      if (!responseData.object || !responseData.object.id) {
        throw new Error('Antwort enthält keine Angebots-ID');
      }

      const orderId = responseData.object.id;

      window.open(`https://my.sevdesk.de/om/edit/type/AN/id/${orderId}`, '_blank');

      onSave();
      onClose();
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationSelect = (orgId: string) => {
    setSelectedOrganization(orgId);
    setIsDropdownOpen(false);
    setSearchTerm('');
  };

  return (
    <Popup
      title="Angebot erstellen"
      onClose={onClose}
      footer={
        <PopupFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateOrder}
            isLoading={isLoading}
            disabled={isLoading || !selectedOrganization}
          >
            Angebot erstellen
          </Button>
        </PopupFooter>
      }
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organisation auswählen <span className="text-red-500">*</span>
          </label>
          
          <Dropdown
            trigger={
              <div className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white">
                {selectedOrgName || 'Organisation auswählen...'}
              </div>
            }
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            contentClassName="max-h-80 overflow-y-auto"
          >
            <div className="p-2 border-b border-gray-200">
              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nach Organisation suchen..."
                className="w-full"
              />
            </div>
            <div className="py-1 max-h-60 overflow-y-auto">
              {filteredOrganizations.length > 0 ? (
                filteredOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleOrganizationSelect(org.id)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                      selectedOrganization === org.id ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'
                    }`}
                  >
                    {org.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  Keine Organisationen gefunden
                </div>
              )}
            </div>
          </Dropdown>
        </div>
      </div>
    </Popup>
  );
}

export default AddOrder;