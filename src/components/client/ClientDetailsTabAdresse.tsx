import React, { useState, useEffect } from 'react';

interface ClientDetailsTabAdresseProps {
  customerId: string;
  onAddressChange: (address: {
    addressStreet: string;
    addressZip: string;
    addressCity: string;
    addressCountry: string;
    email?: string;
  }) => void;
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

function ClientDetailsTabAdresse({ customerId, onAddressChange }: ClientDetailsTabAdresseProps) {
  const [addressData, setAddressData] = useState({
    street: '',
    zip: '',
    city: '',
    countryId: 1
  });
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!customerId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch address data
        const addressResponse = await fetch(`/api/contactAddress/${customerId}`);
        if (!addressResponse.ok) {
          throw new Error(`Failed to fetch address data: ${addressResponse.status}`);
        }
        const addressData = await addressResponse.json();
        
        // Fetch communication ways (email)
        const commResponse = await fetch(`/api/communicationWay/${customerId}`);
        if (!commResponse.ok) {
          throw new Error(`Failed to fetch communication data: ${commResponse.status}`);
        }
        const commData = await commResponse.json();

        if (isMounted) {
          // Process address data
          const address = Array.isArray(addressData.objects) && addressData.objects.length > 0 
            ? addressData.objects[0] 
            : null;

          const newAddressData = {
            street: address?.street || '',
            zip: address?.zip || '',
            city: address?.city || '',
            countryId: address?.country?.id ? parseInt(address.country.id, 10) : 1
          };

          setAddressData(newAddressData);
          
          // Process email data
          const emailComm = commData.objects?.find((comm: any) => 
            comm.type === 'EMAIL' || comm.type?.type === 'EMAIL'
          );
          const emailValue = emailComm?.value || '';
          setEmail(emailValue);

          onAddressChange({
            addressStreet: newAddressData.street,
            addressZip: newAddressData.zip,
            addressCity: newAddressData.city,
            addressCountry: newAddressData.countryId.toString(),
            email: emailValue
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  const handleAddressChange = (field: string, value: string | number) => {
    const updatedAddress = {
      ...addressData,
      [field]: value
    };
    setAddressData(updatedAddress);

    onAddressChange({
      addressStreet: updatedAddress.street,
      addressZip: updatedAddress.zip,
      addressCity: updatedAddress.city,
      addressCountry: updatedAddress.countryId.toString(),
      email
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    onAddressChange({
      addressStreet: addressData.street,
      addressZip: addressData.zip,
      addressCity: addressData.city,
      addressCountry: addressData.countryId.toString(),
      email: newEmail
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <select
          value={addressData.countryId}
          onChange={(e) => handleAddressChange('countryId', parseInt(e.target.value, 10))}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {countryOptions.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          onFocus={(e) => e.target.select()}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

export default ClientDetailsTabAdresse;