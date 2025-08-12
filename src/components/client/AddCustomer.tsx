import React, { useEffect, useState } from 'react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';

interface AddCustomerProps {
  onClose: () => void;
  onSave: (createdCustomerId?: string) => void;
}

const countryOptions = [
  { id: 1, name: 'Deutschland' },
  { id: 14, name: 'Österreich' },
  { id: 41, name: 'Schweiz' },
  { id: 74, name: 'Frankreich' },
  { id: 148, name: 'Niederlande' },
  { id: 195, name: 'Spanien' },
  { id: 106, name: 'Italien' },
  { id: 57, name: 'Dänemark' },
  { id: 194, name: 'Schweden' },
  { id: 164, name: 'Polen' },
  { id: 199, name: 'Ukraine' },
  { id: 103, name: 'Irland' },
  { id: 83, name: 'Griechenland' },
  { id: 185, name: 'Slowakei' },
  { id: 186, name: 'Slowenien' },
];

function AddCustomer({ onClose, onSave }: AddCustomerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    customerNumber: '',
    category: { id: 3, objectName: 'Category' },
    objectName: 'Contact',
    addressStreet: '',
    addressZip: '',
    addressCity: '',
    addressCountry: '1',
    email: ''
  });

  useEffect(() => {
    const fetchNextCustomerNumber = async () => {
      try {
        const res = await fetch('/api/nextCustomerNumber');
        const data = await res.json();
        console.log('Next customer number:', data);

        if (data && data.value) {
          setCustomerData(prev => ({
            ...prev,
            customerNumber: data.value
          }));
        } else {
          console.warn('No customer number received');
        }
      } catch (err) {
        console.error('Error fetching customer number:', err);
      }
    };

    fetchNextCustomerNumber();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountrySelect = (countryId: number) => {
    setCustomerData(prev => ({
      ...prev,
      addressCountry: countryId.toString()
    }));
    setIsCountryDropdownOpen(false);
  };

  const getSelectedCountryName = () => {
    const country = countryOptions.find(c => c.id.toString() === customerData.addressCountry);
    return country ? country.name : 'Land auswählen';
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating customer with data:', customerData);

      // Create the customer
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Customer creation failed');
      }

      const data = await response.json();
      const customerId = data.objects.id;

      // Create address if any address field is filled
      if (customerData.addressStreet || customerData.addressZip || customerData.addressCity) {
        const addressPayload = {
          street: customerData.addressStreet,
          zip: customerData.addressZip,
          city: customerData.addressCity,
          country: { id: customerData.addressCountry, objectName: 'StaticCountry' },
          contact: { id: customerId, objectName: 'Contact' }
        };

        const addressResponse = await fetch('/api/contactAddress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressPayload)
        });

        if (!addressResponse.ok) {
          throw new Error('Failed to create address');
        }
      }

      // Create email communication way if email is provided
      if (customerData.email) {
        const emailPayload = {
          type: 'EMAIL',
          value: customerData.email,
          key: { id: 1, objectName: 'CommunicationWayKey' },
          contact: { id: customerId, objectName: 'Contact' }
        };

        const emailResponse = await fetch('/api/communicationWay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to create email communication way');
        }
      }

      console.log('Customer created successfully:', data);
      onSave(customerId); // Pass the created customer ID
      onClose();
    } catch (err) {
      console.error('Error saving customer:', err);
      setError('Customer could not be created. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popup
      title="Kunde hinzufügen"
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
            disabled={isLoading || !customerData.name || !customerData.customerNumber}
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name des Kunden <span className="text-red-500">*</span>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Straße & Hausnummer
          </label>
          <input
            type="text"
            name="addressStreet"
            value={customerData.addressStreet}
            onChange={handleInputChange}
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
              name="addressZip"
              value={customerData.addressZip}
              onChange={handleInputChange}
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
              name="addressCity"
              value={customerData.addressCity}
              onChange={handleInputChange}
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
                    country.id.toString() === customerData.addressCountry ? 'font-semibold text-gray-900' : 'text-gray-700'
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
            name="email"
            value={customerData.email}
            onChange={handleInputChange}
            onFocus={(e) => e.target.select()}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </Popup>
  );
}

export default AddCustomer;