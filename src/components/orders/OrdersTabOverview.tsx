import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import ItemActionsMenu from '../ui/ItemActionsMenu';

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  header: string;
  addressName: string;
  sumNet: number;
  orderType: string;
  contactId: string;
}

interface FilterState {
  status: string[];
  customer: string[];
}

interface SortState {
  field: 'orderDate' | 'orderNumber' | 'customer' | 'sumNet' | 'sumGross' | null;
  direction: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: '100', label: 'Entwurf' },
  { value: '200', label: 'Versendet' },
  { value: '300', label: 'Abgelehnt / Storniert' },
  { value: '500', label: 'Akzeptiert' },
  { value: '750', label: 'Teilweise abgerechnet' },
  { value: '1000', label: 'Berechnet' },
];

const STATUS_COLORS = {
  100: 'bg-gray-100 text-gray-800',
  200: 'bg-yellow-100 text-yellow-800',
  300: 'bg-red-100 text-red-800',
  500: 'bg-green-100 text-green-800',
  750: 'bg-blue-100 text-blue-800',
  1000: 'bg-green-100 text-green-800',
};

function OrdersTabOverview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ status: [], customer: [] });
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'desc' });
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({});
  
  // Track if user has manually interacted with filters
  const [hasUserInteractedWithFilters, setHasUserInteractedWithFilters] = useState(false);

  // Helper functions
  const getOrganizationName = (addressName: string): string => {
    if (!addressName) return '';
    const parts = addressName.split('|');
    return parts.length > 1 ? parts[1].trim() : addressName;
  };

  const searchOrders = (order: Order, searchTerm: string): boolean => {
    const term = searchTerm.toLowerCase();
    
    const textMatch = 
      order.orderNumber.toLowerCase().includes(term) ||
      getOrganizationName(order.addressName).toLowerCase().includes(term) ||
      order.header.toLowerCase().includes(term);
    
    const netAmount = order.sumNet.toString();
    const grossAmount = order.sumGross.toString();
    const formattedNetAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(order.sumNet).toLowerCase();
    const formattedGrossAmount = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(order.sumGross).toLowerCase();
    
    const amountMatch = 
      netAmount.includes(term) ||
      grossAmount.includes(term) ||
      formattedNetAmount.includes(term) ||
      formattedGrossAmount.includes(term);
    
    return textMatch || amountMatch;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusConfig = (status: string) => {
    const statusNum = parseInt(status);
    const label = STATUS_OPTIONS.find(opt => opt.value === status)?.label || status;
    const colorClass = STATUS_COLORS[statusNum as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    
    return { label, class: colorClass };
  };

  // Data fetching
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error(`${response.status}`);
        const data = await response.json();
        setOrders(data.objects || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Fehler beim Laden der Angebote');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Computed values
  const uniqueCustomers = useMemo(() => {
    const customerSet = new Set<string>();
    orders.forEach(order => {
      const customerName = getOrganizationName(order.addressName);
      if (customerName) {
        customerSet.add(customerName);
      }
    });
    return Array.from(customerSet).sort();
  }, [orders]);

  const availableStatusOptions = useMemo(() => {
    const availableStatuses = new Set<string>();
    orders.forEach(order => {
      availableStatuses.add(String(order.status));
    });
    return STATUS_OPTIONS.filter(option => availableStatuses.has(option.value));
  }, [orders]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => searchOrders(order, searchTerm));
    }

    // Apply status filter - DEFAULT TO DRAFTS AND OPEN IF NO USER INTERACTION
    let statusFilterToApply = filters.status;
    
    // If user hasn't interacted with filters yet, default to showing drafts and open orders
    if (!hasUserInteractedWithFilters && filters.status.length === 0) {
      statusFilterToApply = ['100', '200']; // Show drafts and open orders
    }

    if (statusFilterToApply.length > 0) {
      filtered = filtered.filter(order => {
        const statusStr = String(order.status);
        return statusFilterToApply.includes(statusStr);
      });
    }

    // Apply customer filter
    if (filters.customer.length > 0) {
      filtered = filtered.filter(order => {
        const customerName = getOrganizationName(order.addressName);
        return filters.customer.includes(customerName);
      });
    }

    // Apply sorting
    if (sort.field) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sort.field) {
          case 'orderDate':
            aValue = new Date(a.orderDate).getTime();
            bValue = new Date(b.orderDate).getTime();
            break;
          case 'orderNumber':
            aValue = a.orderNumber;
            bValue = b.orderNumber;
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
  }, [orders, searchTerm, filters, sort, hasUserInteractedWithFilters]);

  // Event handlers
  const handleRowClick = (order: Order, e: React.MouseEvent) => {
    // Check if the click originated from a status badge, dropdown, or action menu
    const target = e.target as HTMLElement;
    const isStatusBadgeClick = target.closest('.status-badge-container');
    const isDropdownClick = target.closest('[data-dropdown]');
    const isActionMenuClick = target.closest('.action-menu-container');

    // Only navigate to sevDesk if not clicking on interactive elements
    if (!isStatusBadgeClick && !isDropdownClick && !isActionMenuClick) {
      window.open(`https://my.sevdesk.de/om/edit/type/AN/id/${order.id}`, '_blank');
    }
  };

  const handleDropdownOpenChange = (dropdownKey: string, isOpen: boolean) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownKey]: isOpen
    }));
  };

  const handleStatusChange = async (orderId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    const order = orders.find(o => o.id === orderId);
    
    if (!order || order.status === newStatus) {
      handleDropdownOpenChange(`status-${orderId}`, false);
      return;
    }

    try {
      setUpdatingStatus(orderId);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      setError(null);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Fehler beim Aktualisieren des Status');
    } finally {
      setUpdatingStatus(null);
      handleDropdownOpenChange(`status-${orderId}`, false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
      setError(null);
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Fehler beim Löschen des Angebots');
    }
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

  const handleAddClick = () => {
    window.open('https://my.sevdesk.de/om/edit/type/AN/id/', '_blank');
  };

  const getSortIcon = (field: SortState['field']) => {
    if (sort.field !== field) {
      return <ChevronDown className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sort.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  // Check if order can be deleted (only draft status)
  const canDeleteOrder = (order: Order) => {
    return parseInt(order.status) === 100; // Only draft orders can be deleted
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
        {/* Header with Search and Filters */}
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <SearchBar
              placeholder="Suche ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-md"
            />
            
            {/* Status Filter */}
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

            {/* Customer Filter */}
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

            {/* Clear Filters Button - Only show if user has actually set filters */}
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
            Angebot erstellen
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSortChange('orderNumber')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    NUMMER
                    {getSortIcon('orderNumber')}
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
                    onClick={() => handleSortChange('orderDate')}
                    className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                  >
                    DATUM
                    {getSortIcon('orderDate')}
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
                    BETRAG (BRUTTO)
                    {getSortIcon('sumGross')}
                  </button>
                </th>
                <th className="w-12 px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedOrders.map((order) => {
                const isUpdating = updatingStatus === order.id;
                const statusConfig = getStatusConfig(order.status);
                const dropdownKey = `status-${order.id}`;

                return (
                  <tr
                    key={order.id}
                    onClick={(e) => handleRowClick(order, e)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="status-badge-container">
                        {isUpdating ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.class}`}>
                            <div className="flex items-center">
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                              Wird aktualisiert...
                            </div>
                          </span>
                        ) : (
                          <div data-dropdown>
                            <Dropdown
                              trigger={
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-colors duration-200 ${statusConfig.class}`}>
                                  {statusConfig.label}
                                </span>
                              }
                              isOpen={openDropdowns[dropdownKey] || false}
                              onOpenChange={(isOpen) => handleDropdownOpenChange(dropdownKey, isOpen)}
                              minWidth="120px"
                              maxWidth="200px"
                            >
                              <div className="py-1">
                                {STATUS_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={(e) => handleStatusChange(order.id, option.value, e)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                      option.value === order.status ? 'font-semibold text-gray-900' : 'text-gray-700'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </Dropdown>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getOrganizationName(order.addressName)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(order.sumNet)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(order.sumGross)}
                    </td>
                    <td className="w-12 px-6 py-4 whitespace-nowrap relative">
                      <div className="action-menu-container">
                        <ItemActionsMenu
                          onEdit={() => window.open(`https://my.sevdesk.de/om/edit/type/AN/id/${order.id}`, '_blank')}
                          onDelete={canDeleteOrder(order) ? () => handleDeleteOrder(order.id) : undefined}
                          deleteMessage={`Möchten Sie das Angebot "${order.orderNumber}" wirklich löschen?`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50"
                  >
                    Keine Angebote gefunden
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

export default OrdersTabOverview;