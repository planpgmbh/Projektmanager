import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';

interface Invoice {
  id: string;
  status: number;
  payDate: string | null;
  invoiceNumber: string;
  invoiceType: string;
  contact: {
    id: string;
    name: string;
    parent?: {
      id: string;
      objectName: string;
      name?: string;
    };
  };
  invoiceDate: string;
  timeToPay: string;
  sumNet: number;
  sumGross: number;
  addressName: string;
  header: string;
}

interface FilterState {
  status: string[];
  customer: string[];
}

interface SortState {
  field: 'invoiceDate' | 'invoiceNumber' | 'customer' | 'sumNet' | 'sumGross' | 'dueDate' | null;
  direction: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: '100', label: 'Entwurf' },
  { value: '200', label: 'Offen' },
  { value: '300', label: 'Teilweise bezahlt' },
  { value: '400', label: 'Bezahlt' },
  { value: '500', label: 'Mahnung verschickt' },
  { value: '600', label: 'Inkasso' },
  { value: '700', label: 'Storniert' },
  { value: '800', label: 'Archiviert' },
  { value: '1000', label: 'Bezahlt' },
  { value: 'overdue', label: 'Fällig' }
];

const STATUS_COLORS = {
  100: 'bg-gray-100 text-gray-800',
  200: 'bg-yellow-100 text-yellow-800',
  300: 'bg-blue-100 text-blue-800',
  400: 'bg-green-100 text-green-800',
  500: 'bg-red-100 text-red-800',
  600: 'bg-red-200 text-red-900',
  700: 'bg-gray-300 text-gray-900',
  800: 'bg-gray-200 text-gray-700',
  1000: 'bg-green-100 text-green-800'
};

const STATUS_LABELS = {
  100: 'Entwurf',
  200: 'Offen',
  300: 'Teilweise bezahlt',
  400: 'Bezahlt',
  500: 'Mahnung verschickt',
  600: 'Inkasso',
  700: 'Storniert',
  800: 'Archiviert',
  1000: 'Bezahlt'
};

function InvoicesTabOverview() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ status: [], customer: [] });
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'desc' });
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  
  // Track if user has manually interacted with filters
  const [hasUserInteractedWithFilters, setHasUserInteractedWithFilters] = useState(false);

  const getOrganizationName = (addressName: string): string => {
    if (!addressName) return '';
    const parts = addressName.split('|');
    return parts.length > 1 ? parts[1].trim() : addressName;
  };

  const isInvoiceOverdue = (invoice: Invoice): boolean => {
    if (Number(invoice.status) !== 200 || invoice.payDate || !invoice.invoiceDate || !invoice.timeToPay) {
      return false;
    }

    try {
      const invoiceDate = new Date(invoice.invoiceDate);
      const daysToPayInt = parseInt(invoice.timeToPay, 10);
      
      if (isNaN(daysToPayInt)) return false;
      
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + daysToPayInt);
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      dueDate.setUTCHours(0, 0, 0, 0);
      
      return today > dueDate;
    } catch {
      return false;
    }
  };

  const calculateDueDateForSorting = (invoice: Invoice): Date => {
    if (invoice.payDate) {
      return new Date(invoice.payDate);
    }

    const invoiceDate = new Date(invoice.invoiceDate);
    const timeToPay = parseInt(invoice.timeToPay || '0', 10);

    if (!isNaN(timeToPay)) {
      invoiceDate.setDate(invoiceDate.getDate() + timeToPay);
    }

    return invoiceDate;
  };

  const searchInvoices = (invoice: Invoice, searchTerm: string): boolean => {
    const term = searchTerm.toLowerCase();
    
    const textMatch = 
      invoice.invoiceNumber.toLowerCase().includes(term) ||
      getOrganizationName(invoice.addressName).toLowerCase().includes(term) ||
      invoice.header.toLowerCase().includes(term);
    
    const netAmount = invoice.sumNet.toString();
    const grossAmount = invoice.sumGross.toString();
    const formattedNetAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(invoice.sumNet).toLowerCase();
    const formattedGrossAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(invoice.sumGross).toLowerCase();
    
    const amountMatch = 
      netAmount.includes(term) ||
      grossAmount.includes(term) ||
      formattedNetAmount.includes(term) ||
      formattedGrossAmount.includes(term);
    
    return textMatch || amountMatch;
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/invoices?embed=contact');
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();

        const invoicesWithParents = await Promise.all(
          data.objects.map(async (invoice: Invoice) => {
            if (invoice.contact?.parent?.id) {
              try {
                const parentResponse = await fetch(`/api/contact/${invoice.contact.parent.id}`);
                if (parentResponse.ok) {
                  const parentData = await parentResponse.json();
                  return {
                    ...invoice,
                    contact: {
                      ...invoice.contact,
                      parent: {
                        ...invoice.contact.parent,
                        name: parentData.objects.name
                      }
                    }
                  };
                }
              } catch (err) {
                console.error('Error fetching parent organization:', err);
              }
            }
            return invoice;
          })
        );

        setInvoices(invoicesWithParents);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError('Fehler beim Laden der Rechnungen');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const uniqueCustomers = useMemo(() => {
    const customerSet = new Set<string>();
    invoices.forEach(invoice => {
      const customerName = getOrganizationName(invoice.addressName);
      if (customerName) {
        customerSet.add(customerName);
      }
    });
    return Array.from(customerSet).sort();
  }, [invoices]);

  const availableStatusOptions = useMemo(() => {
    const availableStatuses = new Set<string>();
    
    invoices.forEach(invoice => {
      availableStatuses.add(String(invoice.status));
      if (isInvoiceOverdue(invoice)) {
        availableStatuses.add('overdue');
      }
    });

    return STATUS_OPTIONS.filter(option => availableStatuses.has(option.value));
  }, [invoices]);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    if (searchTerm) {
      filtered = filtered.filter(invoice => searchInvoices(invoice, searchTerm));
    }

    // Apply status filter - DEFAULT TO ALL EXCEPT PAID IF NO USER INTERACTION
    let statusFilterToApply = filters.status;
    
    // If user hasn't interacted with filters yet, default to showing all except paid invoices
    if (!hasUserInteractedWithFilters && filters.status.length === 0) {
      statusFilterToApply = ['100', '200', '300', '500', '600', '700', '800', 'overdue']; // All except paid (400, 1000)
    }

    if (statusFilterToApply.length > 0) {
      filtered = filtered.filter(invoice => {
        const statusStr = String(invoice.status);
        const isOverdue = isInvoiceOverdue(invoice);
        
        return statusFilterToApply.some(filterStatus => {
          if (filterStatus === 'overdue') {
            return isOverdue;
          }
          return filterStatus === statusStr;
        });
      });
    }

    if (filters.customer.length > 0) {
      filtered = filtered.filter(invoice => {
        const customerName = getOrganizationName(invoice.addressName);
        return filters.customer.includes(customerName);
      });
    }

    if (sort.field) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sort.field) {
          case 'invoiceDate':
            aValue = new Date(a.invoiceDate).getTime();
            bValue = new Date(b.invoiceDate).getTime();
            break;
          case 'invoiceNumber':
            aValue = a.invoiceNumber;
            bValue = b.invoiceNumber;
            break;
          case 'customer':
            aValue = getOrganizationName(a.addressName);
            bValue = getOrganizationName(b.addressName);
            break;
          case 'sumNet':
            aValue = a.sumNet;
            bValue = b.sumNet;
            break;
          case 'sumGross':
            aValue = a.sumGross;
            bValue = b.sumGross;
            break;
          case 'dueDate':
            aValue = calculateDueDateForSorting(a).getTime();
            bValue = calculateDueDateForSorting(b).getTime();
            break;
          default:
            return 0;
        }

        if (sort.direction === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [invoices, searchTerm, filters, sort, hasUserInteractedWithFilters]);

  const getStatusBadge = (invoice: Invoice) => {
    const { status, invoiceType } = invoice;

    if (invoiceType === 'SR') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Stornorechnung
        </span>
      );
    }

    if (isInvoiceOverdue(invoice)) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Fällig
        </span>
      );
    }

    const colorClass = STATUS_COLORS[Number(status) as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    const label = STATUS_LABELS[Number(status) as keyof typeof STATUS_LABELS] || 'Unbekannt';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  };

  const calculateDueDate = (invoice: Invoice) => {
    if (invoice.payDate) {
      return {
        date: formatDate(invoice.payDate),
        isOverdue: false
      };
    }

    const invoiceDate = new Date(invoice.invoiceDate);
    const timeToPay = parseInt(invoice.timeToPay || '0', 10);

    if (!isNaN(timeToPay)) {
      invoiceDate.setDate(invoiceDate.getDate() + timeToPay);
    }

    const isOverdue = isInvoiceOverdue(invoice);

    return {
      date: formatDate(invoiceDate.toISOString()),
      isOverdue
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleStatusFilterChange = (statusValue: string) => {
    // Mark that user has interacted with filters
    setHasUserInteractedWithFilters(true);
    
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(statusValue)
        ? prev.status.filter(s => s !== statusValue)
        : [...prev.status, statusValue]
    }));
  };

  const handleSelectAllStatuses = () => {
    // Mark that user has interacted with filters
    setHasUserInteractedWithFilters(true);
    
    // Select all available status options
    const allStatusValues = availableStatusOptions.map(option => option.value);
    setFilters(prev => ({
      ...prev,
      status: allStatusValues
    }));
  };

  const handleCustomerFilterChange = (customerName: string) => {
    // Mark that user has interacted with filters
    setHasUserInteractedWithFilters(true);
    
    setFilters(prev => ({
      ...prev,
      customer: prev.customer.includes(customerName)
        ? prev.customer.filter(c => c !== customerName)
        : [...prev.customer, customerName]
    }));
  };

  const handleSortChange = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const clearAllFilters = () => {
    // Mark that user has interacted with filters
    setHasUserInteractedWithFilters(true);
    
    setFilters({ status: [], customer: [] });
    setSort({ field: null, direction: 'desc' });
  };

  // Only show active filters indicator if user has actually set filters
  const hasActiveFilters = hasUserInteractedWithFilters && (
    filters.status.length > 0 || 
    filters.customer.length > 0 || 
    sort.field !== null
  );

  const handleRowClick = (invoice: Invoice) => {
    window.open(`https://my.sevdesk.de/fi/detail/type/${invoice.invoiceType || 'RE'}/id/${invoice.id}`, '_blank');
  };

  const handleAddClick = () => {
    window.open('https://my.sevdesk.de/fi/edit/type/RE/id/', '_blank');
  };

  const getSortIcon = (field: SortState['field']) => {
    if (sort.field !== field) {
      return <ChevronDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sort.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <SearchBar
              placeholder="Suche ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md"
            />
            
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                  <span className="text-gray-700">Status</span>
                  {/* Only show filter count if user has actually set filters */}
                  {hasUserInteractedWithFilters && filters.status.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {filters.status.length}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>
              }
              isOpen={isStatusFilterOpen}
              onOpenChange={setIsStatusFilterOpen}
              maxWidth="250px"
            >
              <div className="py-2 max-h-64 overflow-y-auto">
                {/* Select All Option */}
                <button
                  onClick={handleSelectAllStatuses}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 font-medium border-b border-gray-100"
                >
                  Alle anzeigen
                </button>
                
                {availableStatusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => handleStatusFilterChange(option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </Dropdown>

            <Dropdown
              trigger={
                <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                  <span className="text-gray-700">Kunde</span>
                  {filters.customer.length > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {filters.customer.length}
                    </span>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </button>
              }
              isOpen={isCustomerFilterOpen}
              onOpenChange={setIsCustomerFilterOpen}
              maxWidth="300px"
            >
              <div className="py-2 max-h-64 overflow-y-auto">
                {uniqueCustomers.map((customer) => (
                  <label
                    key={customer}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.customer.includes(customer)}
                      onChange={() => handleCustomerFilterChange(customer)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">{customer}</span>
                  </label>
                ))}
              </div>
            </Dropdown>

            {hasActiveFilters && (
              <Button
                variant="secondary"
                onClick={clearAllFilters}
                icon={X}
                className="text-sm h-10"
              >
                Zurücksetzen
              </Button>
            )}
          </div>

          <Button
            variant="primary"
            icon={Plus}
            onClick={handleAddClick}
            className="shrink-0 h-10"
          >
            Rechnung erstellen
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('dueDate')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    FÄLLIGKEIT
                    {getSortIcon('dueDate')}
                  </button>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('invoiceNumber')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    RECHNUNGSNUMMER
                    {getSortIcon('invoiceNumber')}
                  </button>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('customer')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    KUNDE
                    {getSortIcon('customer')}
                  </button>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('invoiceDate')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    DATUM
                    {getSortIcon('invoiceDate')}
                  </button>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('sumNet')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors justify-end w-full"
                  >
                    BETRAG (NETTO)
                    {getSortIcon('sumNet')}
                  </button>
                </th>
                <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('sumGross')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors justify-end w-full"
                  >
                    OFFEN (BRUTTO)
                    {getSortIcon('sumGross')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => handleRowClick(invoice)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {getStatusBadge(invoice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(() => {
                      const dueDateInfo = calculateDueDate(invoice);
                      return (
                        <span className={dueDateInfo.isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                          {dueDateInfo.date}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getOrganizationName(invoice.addressName)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td className="px-6 py-4 pr-[45px] whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(invoice.sumNet)}
                  </td>
                  <td className="px-6 py-4 pr-[45px] whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatCurrency(invoice.sumGross)}
                  </td>
                </tr>
              ))}
              {filteredAndSortedInvoices.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50"
                  >
                    Keine Rechnungen gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InvoicesTabOverview;