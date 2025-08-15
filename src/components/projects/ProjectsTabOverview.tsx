import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SearchBar } from '../ui/SearchBar';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { BudgetBar } from '../ui/BudgetBar';
import { TeamMembers } from '../ui/TeamMembers';
import ItemActionsMenu from '../ui/ItemActionsMenu';
import AddProject from './AddProject';
import ConfirmDialog from '../ui/ConfirmDialog';
import ManageProjectPersonsPopup from './ManageProjectPersonsPopup';

interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  createdAt: Date;
  status: string;
  involvedUserIds?: string[];
  totalBudget?: number;
}

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  priceItemId: string;
  priceItemName?: string;
  hourlyRate?: number;
  hours: number;
  note: string;
  date: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PriceItem {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
  ordernum: number;
}

interface FilterState {
  status: string[];
  customer: string[];
}

interface SortState {
  field: 'name' | 'customerName' | 'status' | 'createdAt' | null;
  direction: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'paused', label: 'Pausiert' },
  { value: 'cancelled', label: 'Abgebrochen' },
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

function ProjectsTabOverview() {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [basicPriceItems, setBasicPriceItems] = useState<PriceItem[]>([]);
  const [customerPricelists, setCustomerPricelists] = useState<{ [customerId: string]: PriceItem[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ status: [], customer: [] });
  const [sort, setSort] = useState<SortState>({ field: null, direction: 'desc' });
  
  // Filter dropdown states
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  
  // Track if user has manually interacted with filters
  const [hasUserInteractedWithFilters, setHasUserInteractedWithFilters] = useState(false);
  
  // Project management states
  const [updatingCustomer, setUpdatingCustomer] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showCustomerChangeConfirm, setShowCustomerChangeConfirm] = useState(false);
  const [pendingCustomerChange, setPendingCustomerChange] = useState<{
    projectId: string;
    newCustomerId: string;
    projectName: string;
    newCustomerName: string;
  } | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({});
  
  // Team management states
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<Project | null>(null);

  // Helper functions
  const searchProjects = (project: Project, searchTerm: string): boolean => {
    const term = searchTerm.toLowerCase();
    return (
      project.name.toLowerCase().includes(term) ||
      project.customerName.toLowerCase().includes(term) ||
      project.customerNumber.toLowerCase().includes(term) ||
      project.status.toLowerCase().includes(term)
    );
  };

  const getInvolvedUsers = (project: Project) => {
    if (!project.involvedUserIds || !allUsers.length) return [];
    return allUsers.filter(user => project.involvedUserIds?.includes(user.id));
  };

  const getStatusConfig = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    const label = option?.label || status;
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800';
    return { label, class: colorClass };
  };

  // Calculate project budget usage with proper price item lookup
  const getProjectBudgetUsage = (project: Project) => {
    const projectTimeEntries = timeEntries.filter(entry => entry.projectId === project.id);
    
    // Get available price items for this project (customer-specific or basic)
    const availablePriceItems = project.customerId && customerPricelists[project.customerId] 
      ? customerPricelists[project.customerId] 
      : basicPriceItems;
    
    // Calculate total value by looking up hourly rates from price items
    const totalValue = projectTimeEntries.reduce((sum, entry) => {
      // First try to use the hourly rate from the time entry itself
      let hourlyRate = entry.hourlyRate || 0;
      
      // If no hourly rate in time entry, look it up from price items
      if (hourlyRate === 0) {
        const priceItem = availablePriceItems.find(item => item.id === entry.priceItemId);
        hourlyRate = priceItem?.hourlyRate || 0;
      }
      
      return sum + (entry.hours * hourlyRate);
    }, 0);
    
    const budget = project.totalBudget || 0;
    
    return { totalValue, budget };
  };

  // Data fetching
  useEffect(() => {
    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Project[];
      
      setProjects(projectsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Kunden: ${response.status}`);
        }

        const data = await response.json();
        const organizations = data.objects.filter((contact: any) => 
          contact.category?.id === '3' || contact.category?.id === 3
        );
        setCustomers(organizations);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Fehler beim Laden der Kunden');
      }
    };

    // Fetch all users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setAllUsers(usersData);
    });

    // Fetch all time entries for budget calculations
    const timeEntriesQuery = query(collection(db, 'timeEntries'));
    const unsubscribeTimeEntries = onSnapshot(timeEntriesQuery, (snapshot) => {
      const timeEntriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as TimeEntry[];
      setTimeEntries(timeEntriesData);
    });

    // Fetch basic price items
    const basicPriceItemsQuery = query(
      collection(db, 'settings/basicpricelist/priceitems'),
      orderBy('ordernum')
    );
    const unsubscribeBasicPriceItems = onSnapshot(basicPriceItemsQuery, (snapshot) => {
      const basicPriceItemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceItem[];
      setBasicPriceItems(basicPriceItemsData);
    });

    fetchCustomers();
    return () => {
      unsubscribeUsers();
      unsubscribeTimeEntries();
      unsubscribeBasicPriceItems();
    };
  }, []);

  // Fetch customer-specific pricelists for all projects
  useEffect(() => {
    if (projects.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    // Get unique customer IDs from projects
    const uniqueCustomerIds = [...new Set(projects.map(p => p.customerId).filter(Boolean))];

    uniqueCustomerIds.forEach(customerId => {
      const customerPricelistQuery = query(
        collection(db, `clients/${customerId}/pricelist`),
        orderBy('ordernum')
      );
      
      const unsubscribe = onSnapshot(customerPricelistQuery, (snapshot) => {
        const customerPricelistData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PriceItem[];
        
        setCustomerPricelists(prev => ({
          ...prev,
          [customerId]: customerPricelistData
        }));
      }, (error) => {
        console.log(`No customer-specific pricelist found for customer ${customerId}`);
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [projects]);

  // Computed values
  const uniqueCustomers = useMemo(() => {
    const customerSet = new Set<string>();
    projects.forEach(project => {
      if (project.customerName) {
        customerSet.add(project.customerName);
      }
    });
    return Array.from(customerSet).sort();
  }, [projects]);

  const availableStatusOptions = useMemo(() => {
    const availableStatuses = new Set<string>();
    projects.forEach(project => {
      availableStatuses.add(project.status);
    });
    return STATUS_OPTIONS.filter(option => availableStatuses.has(option.value));
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project => searchProjects(project, searchTerm));
    }

    // Apply status filter - DEFAULT TO ACTIVE PROJECTS IF NO USER INTERACTION
    let statusFilterToApply = filters.status;
    
    // If user hasn't interacted with filters yet, default to showing only active projects
    if (!hasUserInteractedWithFilters && filters.status.length === 0) {
      statusFilterToApply = ['active']; // Show only active projects
    }

    if (statusFilterToApply.length > 0) {
      filtered = filtered.filter(project => statusFilterToApply.includes(project.status));
    }

    // Apply customer filter
    if (filters.customer.length > 0) {
      filtered = filtered.filter(project => filters.customer.includes(project.customerName));
    }

    // Apply sorting
    if (sort.field) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date;
        let bValue: string | number | Date;

        switch (sort.field) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'customerName':
            aValue = a.customerName;
            bValue = b.customerName;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'createdAt':
            aValue = a.createdAt?.getTime() || 0;
            bValue = b.createdAt?.getTime() || 0;
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
  }, [projects, searchTerm, filters, sort, hasUserInteractedWithFilters]);

  // Event handlers
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      setError(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Fehler beim Löschen des Projekts');
    }
  };

  const handleDropdownOpenChange = (dropdownKey: string, isOpen: boolean) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownKey]: isOpen
    }));
  };

  const handleCustomerChangeRequest = (projectId: string, newCustomerId: string) => {
    const project = projects.find(p => p.id === projectId);
    const newCustomer = customers.find(c => c.id === newCustomerId);
    
    if (!project || !newCustomer || project.customerId === newCustomerId) {
      handleDropdownOpenChange(`customer-${projectId}`, false);
      return;
    }

    setPendingCustomerChange({
      projectId,
      newCustomerId,
      projectName: project.name,
      newCustomerName: newCustomer.name
    });
    setShowCustomerChangeConfirm(true);
    handleDropdownOpenChange(`customer-${projectId}`, false);
  };

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    const project = projects.find(p => p.id === projectId);
    
    if (!project || project.status === newStatus) {
      handleDropdownOpenChange(`status-${projectId}`, false);
      return;
    }

    try {
      setUpdatingStatus(projectId);
      
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: newStatus
      });

      setError(null);
    } catch (err) {
      console.error('Error updating project status:', err);
      setError('Fehler beim Ändern des Status');
    } finally {
      setUpdatingStatus(null);
      handleDropdownOpenChange(`status-${projectId}`, false);
    }
  };

  const confirmCustomerChange = async () => {
    if (!pendingCustomerChange) return;

    try {
      setUpdatingCustomer(pendingCustomerChange.projectId);
      
      const selectedCustomerData = customers.find(c => c.id === pendingCustomerChange.newCustomerId);
      if (!selectedCustomerData) {
        setError('Kunde nicht gefunden');
        return;
      }

      const projectRef = doc(db, 'projects', pendingCustomerChange.projectId);
      await updateDoc(projectRef, {
        customerId: selectedCustomerData.id,
        customerName: selectedCustomerData.name,
        customerNumber: selectedCustomerData.customerNumber
      });

      setError(null);
    } catch (err) {
      console.error('Error updating project customer:', err);
      setError('Fehler beim Ändern des Kunden');
    } finally {
      setUpdatingCustomer(null);
      setShowCustomerChangeConfirm(false);
      setPendingCustomerChange(null);
    }
  };

  const cancelCustomerChange = () => {
    setShowCustomerChangeConfirm(false);
    setPendingCustomerChange(null);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unbekannter Kunde';
  };

  // Filter handlers
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

  const handleNewProjectSaved = () => {
    setIsAddingProject(false);
  };

  const handleManageTeam = (project: Project) => {
    setSelectedProjectForTeam(project);
  };

  const handleSaveInvolvedPersons = async (updatedInvolvedUserIds: string[], updatedPMUserIds: string[]) => {
    if (!selectedProjectForTeam) return;

    try {
      const projectRef = doc(db, 'projects', selectedProjectForTeam.id);
      await updateDoc(projectRef, { 
        involvedUserIds: updatedInvolvedUserIds,
        PMUserIDs: updatedPMUserIds 
      });
    } catch (err) {
      console.error('Error updating involved persons:', err);
      setError('Fehler beim Speichern der beteiligten Personen');
      throw err;
    }
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
    <>
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

              {/* Clear Filters Button */}
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
              onClick={() => setIsAddingProject(true)}
              className="shrink-0 h-10"
            >
              Projekt anlegen
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
                      onClick={() => handleSortChange('name')}
                      className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      PROJEKTNAME
                      {getSortIcon('name')}
                    </button>
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSortChange('customerName')}
                      className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                    >
                      KUNDE
                      {getSortIcon('customerName')}
                    </button>
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BUDGET
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TEAMMITGLIEDER
                  </th>
                  <th className="w-12 px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedProjects.map((project) => {
                  const isUpdatingStatus = updatingStatus === project.id;
                  const isUpdatingCustomer = updatingCustomer === project.id;
                  const statusConfig = getStatusConfig(project.status);
                  const statusDropdownKey = `status-${project.id}`;
                  const customerDropdownKey = `customer-${project.id}`;
                  const involvedUsers = getInvolvedUsers(project);
                  const budgetUsage = getProjectBudgetUsage(project);

                  return (
                    <tr
                      key={project.id}
                      className="group transition-colors duration-150 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {isUpdatingStatus ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.class}`}>
                              <div className="flex items-center">
                                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
                                Wird aktualisiert...
                              </div>
                            </span>
                          ) : (
                            <Dropdown
                              trigger={
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-colors duration-200 ${statusConfig.class}`}>
                                  {statusConfig.label}
                                </span>
                              }
                              isOpen={openDropdowns[statusDropdownKey] || false}
                              onOpenChange={(isOpen) => handleDropdownOpenChange(statusDropdownKey, isOpen)}
                              minWidth="120px"
                              maxWidth="200px"
                            >
                              <div className="py-1">
                                {STATUS_OPTIONS.map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(project.id, option.value)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                      option.value === project.status ? 'font-semibold text-gray-900' : 'text-gray-700'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </Dropdown>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          to={`/projects/${project.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {isUpdatingCustomer ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                              Wird aktualisiert...
                            </div>
                          ) : (
                            <Dropdown
                              trigger={
                                <span className="cursor-pointer hover:text-blue-600 block w-full">
                                  {getCustomerName(project.customerId)}
                                </span>
                              }
                              isOpen={openDropdowns[customerDropdownKey] || false}
                              onOpenChange={(isOpen) => handleDropdownOpenChange(customerDropdownKey, isOpen)}
                              minWidth="150px"
                              maxWidth="300px"
                            >
                              <div className="py-1">
                                {customers.map((customer) => (
                                  <button
                                    key={customer.id}
                                    onClick={() => handleCustomerChangeRequest(project.id, customer.id)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                      customer.id === project.customerId ? 'font-semibold text-gray-900' : 'text-gray-700'
                                    }`}
                                  >
                                    {customer.name}
                                  </button>
                                ))}
                              </div>
                            </Dropdown>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BudgetBar
                          totalValue={budgetUsage.totalValue}
                          budget={budgetUsage.budget}
                          height="sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TeamMembers
                          users={involvedUsers}
                          maxVisible={3}
                          size="md"
                          onManageClick={() => handleManageTeam(project)}
                        />
                      </td>
                      <td className="w-12 px-6 py-4 whitespace-nowrap relative">
                        <ItemActionsMenu
                          onEdit={() => window.location.href = `/projects/${project.id}`}
                          onDelete={() => handleDeleteProject(project.id)}
                          deleteMessage={`Möchten Sie das Projekt "${project.name}" wirklich löschen?`}
                        />
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50"
                    >
                      Keine Projekte gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isAddingProject && (
          <AddProject
            onClose={() => setIsAddingProject(false)}
            onSave={handleNewProjectSaved}
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={showCustomerChangeConfirm}
        title="Kunde ändern"
        message={`Möchtest du wirklich das Projekt "${pendingCustomerChange?.projectName}" dem Kunden "${pendingCustomerChange?.newCustomerName}" zuweisen?`}
        confirmLabel="Ja, ändern"
        cancelLabel="Abbrechen"
        onConfirm={confirmCustomerChange}
        onCancel={cancelCustomerChange}
      />

      {selectedProjectForTeam && (
        <ManageProjectPersonsPopup
          project={selectedProjectForTeam}
          allUsers={allUsers}
          onClose={() => setSelectedProjectForTeam(null)}
          onSave={handleSaveInvolvedPersons}
        />
      )}
    </>
  );
}

export default ProjectsTabOverview;