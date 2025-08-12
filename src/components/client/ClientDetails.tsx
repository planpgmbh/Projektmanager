import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import ClientDetailsTabPerson from './ClientDetailsTabPerson';
import ClientDetailsTabEstimates from './ClientDetailsTabEstimates';
import ClientDetailsTabInvoice from './ClientDetailsTabInvoice';
import ClientDetailsTabPricing from './ClientDetailsTabPricing';
import AddContact from './AddContact';
import { Popup, PopupFooter, PopupDangerButton } from '../ui/Popup';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Customer, Contact } from '../../types';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type TabType = 'adresse' | 'personen' | 'angebote' | 'rechnungen' | 'preisliste';

interface ClientDetailsProps {
  customer: Customer;
  onClose: () => void;
  initialTab?: TabType;
}

const countryOptions = [
  { id: 1, name: 'Deutschland' },
  { id: 3, name: 'Österreich' },
  { id: 2, name: 'Schweiz' },
];

function ClientDetails({ customer, onClose, initialTab }: ClientDetailsProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'adresse');
  const [customerData, setCustomerData] = useState({
    name: customer.name,
    customerNumber: customer.customerNumber,
    id: customer.id,
    category: { id: 3, objectName: 'Category' },
    objectName: 'Contact'
  });
  const [addressData, setAddressData] = useState({
    street: '',
    zip: '',
    city: '',
    countryId: 1
  });
  const [email, setEmail] = useState('');
  const [addressId, setAddressId] = useState<string | null>(null);
  const [emailCommId, setEmailCommId] = useState<string | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(false);
  const [refreshPersonsKey, setRefreshPersonsKey] = useState(0);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [hasPricelist, setHasPricelist] = useState<boolean | null>(null);

  // Check if customer has a pricelist
  useEffect(() => {
    if (!customer.id) return;

    const pricelistQuery = query(
      collection(db, `clients/${customer.id}/pricelist`)
    );

    const unsubscribe = onSnapshot(pricelistQuery, (snapshot) => {
      const hasItems = !snapshot.empty;
      setHasPricelist(hasItems);
      
      // If no initial tab was specified and customer has no pricelist, switch to pricelist tab
      if (!initialTab && !hasItems && activeTab === 'adresse') {
        setActiveTab('preisliste');
      }
    }, (error) => {
      // If there's an error (e.g., collection doesn't exist), assume no pricelist
      setHasPricelist(false);
      
      // If no initial tab was specified and we can't find a pricelist, switch to pricelist tab
      if (!initialTab && activeTab === 'adresse') {
        setActiveTab('preisliste');
      }
    });

    return () => unsubscribe();
  }, [customer.id, initialTab, activeTab]);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!customer.id) return;

      try {
        setIsAddressLoading(true);
        setError(null);

        // Fetch address data
        const addressResponse = await fetch(`/api/contactAddress/${customer.id}`);
        if (!addressResponse.ok) {
          throw new Error(`Failed to fetch address data: ${addressResponse.status}`);
        }
        const addressData = await addressResponse.json();
        
        // Fetch communication ways (email)
        const commResponse = await fetch(`/api/communicationWay/${customer.id}`);
        if (!commResponse.ok) {
          throw new Error(`Failed to fetch communication data: ${commResponse.status}`);
        }
        const commData = await commResponse.json();

        if (isMounted) {
          // Process address data
          const address = Array.isArray(addressData.objects) && addressData.objects.length > 0 
            ? addressData.objects[0] 
            : null;

          setAddressId(address?.id || null);
          setAddressData({
            street: address?.street || '',
            zip: address?.zip || '',
            city: address?.city || '',
            countryId: address?.country?.id ? parseInt(address.country.id, 10) : 1
          });
          
          // Process email data
          const emailComm = commData.objects?.find((comm: any) => 
            comm.type === 'EMAIL' || comm.type?.type === 'EMAIL'
          );
          setEmailCommId(emailComm?.id || null);
          setEmail(emailComm?.value || '');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setIsAddressLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [customer.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (field: string, value: string | number) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCountrySelect = (countryId: number) => {
    handleAddressChange('countryId', countryId);
    setIsCountryDropdownOpen(false);
  };

  const getSelectedCountryName = () => {
    const country = countryOptions.find(c => c.id === addressData.countryId);
    return country ? country.name : 'Land auswählen';
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update customer data
      const customerResponse = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!customerResponse.ok) {
        throw new Error('Failed to update customer data');
      }

      // Update or create address
      if (addressData.street || addressData.zip || addressData.city) {
        const addressPayload = {
          street: addressData.street,
          zip: addressData.zip,
          city: addressData.city,
          country: { id: addressData.countryId, objectName: 'StaticCountry' },
          contact: { id: customer.id, objectName: 'Contact' }
        };

        const addressMethod = addressId ? 'PUT' : 'POST';
        const addressUrl = addressId 
          ? `/api/contactAddress/${addressId}`
          : '/api/contactAddress';

        const addressResponse = await fetch(addressUrl, {
          method: addressMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressPayload)
        });

        if (!addressResponse.ok) {
          throw new Error('Failed to update address');
        }
      }

      // Update or create email communication way
      if (email) {
        const emailPayload = {
          type: 'EMAIL',
          value: email,
          key: { id: 1, objectName: 'CommunicationWayKey' },
          contact: { id: customer.id, objectName: 'Contact' }
        };

        const emailMethod = emailCommId ? 'PUT' : 'POST';
        const emailUrl = emailCommId 
          ? `/api/communicationWay/${emailCommId}`
          : '/api/communicationWay';

        const emailResponse = await fetch(emailUrl, {
          method: emailMethod,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to update email');
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving data:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactAdded = () => {
    setIsAddingContact(false);
    setRefreshPersonsKey(prev => prev + 1);
  };

  const handleDeleteCustomer = async () => {
    setIsDeletingCustomer(true);
    setError(null);

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server error response:', errorData);
        throw new Error(`Failed to delete customer: ${response.status} ${response.statusText}`);
      }

      console.log('Customer deleted successfully');
      onClose();
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete customer. Please try again.');
    } finally {
      setIsDeletingCustomer(false);
      setShowDeleteCustomerConfirm(false);
    }
  };

  return (
    <>
      <Popup
        title={
          <div className="flex items-center justify-between w-full">
            <span>Organisation bearbeiten</span>
            <a
              href={`https://my.sevdesk.de/crm/detail/id/${customer.id}`}
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
        maxWidth="3xl"
        footer={
          <PopupFooter>
            <PopupDangerButton
              onClick={() => setShowDeleteCustomerConfirm(true)}
              isLoading={isDeletingCustomer}
            >
              Kunde löschen
            </PopupDangerButton>
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
              disabled={isLoading || !customerData.name}
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

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name der Organisation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={customerData.name}
            onChange={handleInputChange}
            onFocus={(e) => e.target.select()}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Tab Navigation - Fixed */}
        <div className="border-b border-gray-200 mt-4 mb-6">
          <nav className="-mb-px flex">
            <button
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'adresse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('adresse')}
            >
              Adresse
            </button>
            <button
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'personen'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('personen')}
            >
              Personen
            </button>
            <button
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'angebote'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('angebote')}
            >
              Angebote
            </button>
            <button
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rechnungen'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('rechnungen')}
            >
              Rechnungen
            </button>
            <button
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'preisliste'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('preisliste')}
            >
              Preisliste
              {hasPricelist === false && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content - Scrollable */}
        <div className="min-h-[400px] max-h-[500px] overflow-y-auto">
          {activeTab === 'adresse' && (
            <div className="space-y-6">
              {isAddressLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Straße & Hausnummer
                    </label>
                    <input
                      type="text"
                      value={addressData.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PLZ
                      </label>
                      <input
                        type="text"
                        value={addressData.zip}
                        onChange={(e) => handleAddressChange('zip', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stadt
                      </label>
                      <input
                        type="text"
                        value={addressData.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Land
                    </label>
                    <Dropdown
                      trigger={
                        <div className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white">
                          {getSelectedCountryName()}
                        </div>
                      }
                      isOpen={isCountryDropdownOpen}
                      onOpenChange={setIsCountryDropdownOpen}
                    >
                      <div className="py-1">
                        {countryOptions.map((country) => (
                          <button
                            key={country.id}
                            onClick={() => handleCountrySelect(country.id)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                              country.id === addressData.countryId ? 'font-semibold text-gray-900' : 'text-gray-700'
                            }`}
                          >
                            {country.name}
                          </button>
                        ))}
                      </div>
                    </Dropdown>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === 'personen' && (
            <ClientDetailsTabPerson 
              key={`persons-${customer.id}-${refreshPersonsKey}`}
              selectedOrganization={customer}
              onAddPerson={() => setIsAddingContact(true)}
            />
          )}
          {activeTab === 'angebote' && (
            <ClientDetailsTabEstimates 
              key={`estimates-${customer.id}-${activeTab}`}
              customerId={customer.id}
            />
          )}
          {activeTab === 'rechnungen' && (
            <ClientDetailsTabInvoice 
              key={`invoices-${customer.id}-${activeTab}`}
              customerId={customer.id}
            />
          )}
          {activeTab === 'preisliste' && (
            <ClientDetailsTabPricing 
              key={`pricelist-${customer.id}-${activeTab}`}
              customerId={customer.id}
            />
          )}
        </div>
      </Popup>

      {isAddingContact && (
        <AddContact
          orgId={customer.id}
          orgName={customer.name}
          onClose={() => setIsAddingContact(false)}
          onSaved={handleContactAdded}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteCustomerConfirm}
        title="Kunde löschen"
        message="Möchten Sie diesen Kunden wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleDeleteCustomer}
        onCancel={() => setShowDeleteCustomerConfirm(false)}
      />
    </>
  );
}

export default ClientDetails;