import React, { useState, useEffect } from 'react';

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

interface ClientDetailsTabInvoiceProps {
  customerId: string;
}

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

const statusClasses: Record<number, string> = {
  100: 'bg-gray-100 text-gray-800',
  200: 'bg-yellow-100 text-yellow-800',
  300: 'bg-blue-100 text-blue-800',
  400: 'bg-green-100 text-green-800',
  500: 'bg-red-100 text-red-800',
  600: 'bg-red-200 text-red-900',
  700: 'bg-gray-300 text-gray-900',
  1000: 'bg-gray-300 text-gray-900'
};

function ClientDetailsTabInvoice({ customerId }: ClientDetailsTabInvoiceProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!customerId) {
        setError('Keine Kunden-ID vorhanden');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

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

  const handleRowClick = (invoice: Invoice) => {
    window.open(`https://my.sevdesk.de/fi/edit/type/${invoice.invoiceType || 'RE'}/id/${invoice.id}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
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

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Rechnungen vorhanden
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nr.</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betreff</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleRowClick(invoice)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[invoice.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusMap[invoice.status] || invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{invoice.invoiceNumber}</td>
              <td className="px-6 py-4">{invoice.header}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatDate(invoice.invoiceDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(invoice.sumGross)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientDetailsTabInvoice;