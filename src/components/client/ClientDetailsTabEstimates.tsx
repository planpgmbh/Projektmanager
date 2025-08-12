import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  status: number;
  orderNumber: string;
  orderDate: string;
  header: string;
  addressName: string;
  sumNet: number;
  customerInternalNote?: string;
  orderType: string;
  contactId: string;
}

interface ClientDetailsTabEstimatesProps {
  customerId: string;
}

const statusMap: Record<number, string> = {
  100: 'Entwurf',
  200: 'Offen',
  300: 'Abgelehnt',
  500: 'Angenommen',
};

const statusClasses: Record<number, string> = {
  100: 'bg-gray-100 text-gray-800',
  200: 'bg-yellow-100 text-yellow-800',
  300: 'bg-red-100 text-red-800',
  500: 'bg-green-100 text-green-800',
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

function ClientDetailsTabEstimates({ customerId }: ClientDetailsTabEstimatesProps) {
  const [estimates, setEstimates] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstimates = async () => {
      if (!customerId) {
        setError('Keine Kunden-ID vorhanden');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/orders?contact[id]=${customerId}&contact[objectName]=Contact&orderType=AN`);
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();

const parsed: Order[] = (data.objects || []).map((o: any) => ({
  id: o.id,
  status: parseInt(o.status, 10),
  orderNumber: o.orderNumber,
  orderDate: o.orderDate,
  header: o.header,
  addressName: o.addressName,
  sumNet: parseFloat(o.sumNet),
  customerInternalNote: o.customerInternalNote,
  orderType: o.orderType,
  contactId: o.contact?.id
}));
const filtered = parsed.filter(
  o => o.orderType === 'AN' && o.contactId === customerId
);

setEstimates(filtered);

      } catch (err) {
        console.error('Error fetching estimates:', err);
        setError('Fehler beim Laden der Angebote');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstimates();
  }, [customerId]);

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

  if (estimates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Angebote vorhanden
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betreff</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag (Netto)</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {estimates.map((estimate) => (
            <tr
              key={estimate.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => window.open(`https://my.sevdesk.de/om/edit/type/AN/id/${estimate.id}`, '_blank')}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[estimate.status] || 'bg-gray-100 text-gray-800'}`}>
                  {statusMap[estimate.status] || estimate.status}
                </span>
              </td>
              <td className="px-6 py-4">{estimate.customerInternalNote || estimate.header}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatDate(estimate.orderDate)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(estimate.sumNet)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientDetailsTabEstimates;