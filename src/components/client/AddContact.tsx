import React, { useState } from 'react';
import { Popup, PopupFooter } from '../ui/Popup';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';

interface AddContactProps {
  orgId: string;
  orgName: string;
  onClose: () => void;
  onSaved?: () => void;
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

const AddContact = ({ orgId, orgName, onClose, onSaved }: AddContactProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const [contact, setContact] = useState({
    surename: '',
    familyname: '',
  });

  const [contactDetails, setContactDetails] = useState({
    email: '',
    phone: '',
  });

  const [address, setAddress] = useState({
    street: '',
    zip: '',
    city: '',
    countryId: 1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, stateUpdater: any) => {
    const { name, value } = e.target;
    stateUpdater((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCountrySelect = (countryId: number) => {
    setAddress(prev => ({ ...prev, countryId }));
    setIsCountryDropdownOpen(false);
  };

  const getSelectedCountryName = () => {
    const country = countryOptions.find(c => c.id === address.countryId);
    return country ? country.name : 'Land auswählen';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const contactPayload = {
        surename: contact.surename,
        familyname: contact.familyname,
        category: { id: 3, objectName: 'Category' },
        parent: { id: orgId, objectName: 'Contact' },
      };

      const resContact = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactPayload),
      });

      if (!resContact.ok) throw new Error(await resContact.text());

      const createdContact = await resContact.json();
      const contactId = createdContact.objects.id;

      if (address.street || address.zip || address.city) {
        const addressPayload = {
          contact: { id: contactId, objectName: 'Contact' },
          street: address.street,
          zip: address.zip,
          city: address.city,
          country: { id: address.countryId, objectName: 'StaticCountry' },
          name: `${contact.surename} ${contact.familyname}`.trim(),
          category: { id: 1, objectName: 'Category' },
        };

        const resAddress = await fetch('/api/contactAddress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addressPayload),
        });

        if (!resAddress.ok) throw new Error(await resAddress.text());
      }

      const commPayloads = [];

      if (contactDetails.email) {
        commPayloads.push({
          contact: { id: contactId, objectName: 'Contact' },
          type: 'EMAIL',
          value: contactDetails.email,
          key: { id: 1, objectName: 'CommunicationWayKey' },
          main: true,
          objectName: 'CommunicationWay',
        });
      }

      if (contactDetails.phone) {
        commPayloads.push({
          contact: { id: contactId, objectName: 'Contact' },
          type: 'PHONE',
          value: contactDetails.phone,
          key: { id: 2, objectName: 'CommunicationWayKey' },
          main: true,
          objectName: 'CommunicationWay',
        });
      }

      if (commPayloads.length > 0) {
        const commResponses = await Promise.all(commPayloads.map((payload) =>
          fetch('/api/communicationWay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        ));

        for (const response of commResponses) {
          if (!response.ok) throw new Error(await response.text());
        }
      }

      onSaved?.();
      onClose();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popup
      title="Person anlegen"
      onClose={onClose}
      footer={
        <PopupFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || !contact.familyname}
          >
            Speichern
          </Button>
        </PopupFooter>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vorname</label>
            <input
              type="text"
              name="surename"
              value={contact.surename}
              onChange={(e) => handleInputChange(e, setContact)}
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
              value={contact.familyname}
              onChange={(e) => handleInputChange(e, setContact)}
              onFocus={(e) => e.target.select()}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              name="email"
              value={contactDetails.email}
              onChange={(e) => handleInputChange(e, setContactDetails)}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              name="phone"
              value={contactDetails.phone}
              onChange={(e) => handleInputChange(e, setContactDetails)}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Straße & Hausnummer</label>
            <input
              type="text"
              name="street"
              value={address.street}
              onChange={(e) => handleInputChange(e, setAddress)}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PLZ</label>
            <input
              type="text"
              name="zip"
              value={address.zip}
              onChange={(e) => handleInputChange(e, setAddress)}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stadt</label>
            <input
              type="text"
              name="city"
              value={address.city}
              onChange={(e) => handleInputChange(e, setAddress)}
              onFocus={(e) => e.target.select()}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
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
                      country.id === address.countryId ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {country.name}
                  </button>
                ))}
              </div>
            </Dropdown>
          </div>
        </div>
      </form>
    </Popup>
  );
};

export default AddContact;