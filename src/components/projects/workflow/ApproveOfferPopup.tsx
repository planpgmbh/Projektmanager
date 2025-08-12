import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Popup, PopupFooter } from '../../ui/Popup';
import { Button } from '../../ui/Button';
import { Dropdown } from '../../ui/Dropdown';

interface ApproveOfferPopupProps {
  currentStatus: string;
  offerNumber?: string;
  onClose: () => void;
  onStatusChange: (status: 'approved' | 'open') => void;
  onResetStep?: () => void;
}

const statusOptions = [
  { value: 'open', label: 'Angebot offen', description: 'Angebot wartet auf Kundenrückmeldung' },
  { value: 'approved', label: 'Angebot freigegeben', description: 'Angebot wurde vom Kunden angenommen' },
];

function ApproveOfferPopup({ currentStatus, offerNumber, onClose, onStatusChange, onResetStep }: ApproveOfferPopupProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSave = () => {
    onStatusChange(selectedStatus as 'approved' | 'open');
    onClose();
  };

  const getSelectedStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === selectedStatus);
    return option ? option.label : 'Status auswählen';
  };

  const hasChanges = selectedStatus !== currentStatus;

  const handleOpenOfferInSevDesk = () => {
    // We need the offer ID to open it in sevDesk
    // This would need to be passed as a prop from the parent component
    // For now, we'll open the general offers page
    window.open('https://my.sevdesk.de/om/', '_blank');
  };

  return (
    <Popup
      title="Angebotsstatus ändern"
      onClose={onClose}
      footer={
        <PopupFooter>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Status ändern
          </Button>
        </PopupFooter>
      }
    >
      <div className="space-y-4">
        {offerNumber && (
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  <strong>Angebot:</strong> {offerNumber}
                </div>
              </div>
              <button
                onClick={handleOpenOfferInSevDesk}
                className="ml-4 px-3 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                title="In sevDesk öffnen"
              >
                <ExternalLink className="h-4 w-4" />
                Zum Angebot
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Neuer Status
          </label>
          <Dropdown
            trigger={
              <div className="w-full border border-gray-300 rounded-md px-3 py-2 cursor-pointer hover:border-gray-400 bg-white">
                {getSelectedStatusLabel()}
              </div>
            }
            isOpen={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
          >
            <div className="py-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedStatus(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 text-sm hover:bg-gray-100 block ${
                    option.value === selectedStatus ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </Dropdown>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            Ändern Sie den Status des Angebots basierend auf der Kundenrückmeldung. 
            Nur freigegebene Angebote können zur Rechnungserstellung verwendet werden.
          </p>
        </div>
      </div>
    </Popup>
  );
}

export default ApproveOfferPopup;