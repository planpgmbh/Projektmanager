import React, { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink } from 'lucide-react';
import { Popup, PopupFooter } from '../../ui/Popup';
import { Button } from '../../ui/Button';

interface Invoice {
  id: string;
  status: number;
  payDate: string | null;
  invoiceNumber: string;
  invoiceType: string;
  contact: {
    id: string;
    name: string;
  };
  invoiceDate: string;
  timeToPay: string;
  sumNet: number;
  sumGross: number;
  addressName: string;
  header: string;
}

interface SelectOrCreateInvoicePopupProps {
  customerId: string;
  offerId?: string; // New prop for the offer ID
  onClose: () => void;
  onSelectInvoice: (invoiceId: string, invoiceNumber: string) => void;
  onResetStep?: () => void;
}

function SelectOrCreateInvoicePopup({ 
  customerId, 
  offerId, 
  onClose, 
  onSelectInvoice, 
  onResetStep 
}: SelectOrCreateInvoicePopupProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/invoices?contact[id]=${customerId}&contact[objectName]=Contact`);
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();

        const parsed: Invoice[] = (data.objects || []).map((invoice: any) => ({
          id: invoice.id,
          status: parseInt(invoice.status, 10),
          payDate: invoice.payDate,
          invoiceNumber: invoice.invoiceNumber,
          invoiceType: invoice.invoiceType,
          contact: invoice.contact,
          invoiceDate: invoice.invoiceDate,
          timeToPay: invoice.timeToPay,
          sumNet: parseFloat(invoice.sumNet),
          sumGross: parseFloat(invoice.sumGross),
          addressName: invoice.addressName,
          header: invoice.header
        }));

        const filtered = parsed.filter(inv => inv.contact?.id === customerId);
        setInvoices(filtered);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Fehler beim Laden der Rechnungen');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, [customerId]);

  const filteredInvoices = searchTerm
    ? invoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.header.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoices;

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusLabel = (status: number) => {
    const statusMap: Record<number, string> = {
      100: 'Entwurf',
      200: 'Offen',
      300: 'Teilweise bezahlt',
      400: 'Bezahlt',
      500: 'Mahnung verschickt',
      600: 'Inkasso',
      700: 'Storniert',
      1000: 'Storniert'
    };
    return statusMap[status] || status.toString();
  };

  const getStatusColor = (status: number) => {
    const statusColors: Record<number, string> = {
      100: 'bg-gray-100 text-gray-800',
      200: 'bg-yellow-100 text-yellow-800',
      300: 'bg-blue-100 text-blue-800',
      400: 'bg-green-100 text-green-800',
      500: 'bg-red-100 text-red-800',
      600: 'bg-red-200 text-red-900',
      700: 'bg-gray-300 text-gray-900',
      1000: 'bg-gray-300 text-gray-900'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    onSelectInvoice(invoice.id, invoice.invoiceNumber);
    onClose();
  };

  const handleOpenInvoiceInSevDesk = (invoiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://my.sevdesk.de/fi/edit/type/RE/id/${invoiceId}`, '_blank');
  };

  const handleCreateInvoice = async () => {
    if (!offerId) {
      // Fallback: Open sevDesk invoice creation page
      window.open('https://my.sevdesk.de/fi/edit/type/RE/id/', '_blank');
      onClose();
      return;
    }

    setIsCreatingInvoice(true);
    setError(null);

    try {
      // Create invoice from offer using the new API endpoint
      const response = await fetch('/api/invoices/createFromOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: offerId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const data = await response.json();
      
      // Extract invoice information from the response
      const newInvoice = data.objects;
      if (!newInvoice || !newInvoice.id) {
        throw new Error('Invalid response from invoice creation');
      }

      // Open the new invoice in sevDesk
      window.open(`https://my.sevdesk.de/fi/edit/type/RE/id/${newInvoice.id}`, '_blank');

      // Select the new invoice in the workflow
      onSelectInvoice(newInvoice.id, newInvoice.invoiceNumber);
      onClose();

    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Rechnung');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return (
    <Popup
      title="Rechnung auswählen oder erstellen"
      onClose={onClose}
      maxWidth="3xl"
      footer={
        <PopupFooter>
          <Button variant="secondary" onClick={onClose} disabled={isCreatingInvoice}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateInvoice}
            isLoading={isCreatingInvoice}
            disabled={isCreatingInvoice}
          >
            {offerId ? 'Rechnung aus Angebot erstellen' : 'Neue Rechnung erstellen'}
          </Button>
        
        </PopupFooter>
      }
    >
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Nach Rechnungsnummer oder Betreff suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {filteredInvoices.length > 0 ? (
            <div className="space-y-2">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => handleInvoiceSelect(invoice)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{invoice.header}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(invoice.invoiceDate)} • {formatCurrency(invoice.sumGross)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleOpenInvoiceInSevDesk(invoice.id, e)}
                      className="ml-4 px-3 py-2 text-gray-600 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-150 flex items-center gap-2"
                      title="In sevDesk öffnen"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Zur Rechnung
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Keine Rechnungen gefunden' : 'Keine Rechnungen vorhanden'}
            </div>
          )}
        </div>
      )}
    </Popup>
  );
}

export default SelectOrCreateInvoicePopup;