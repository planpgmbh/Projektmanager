import React, { useState, useEffect, useMemo } from 'react';
import { ListTodo, ChevronDown, ChevronUp, X, Calendar, Clock } from 'lucide-react';
import { collection, query, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthState } from '../hooks/useAuthState';
import { useProjectsData } from '../hooks/useProjectsData';
import { usePriceItemsData } from '../hooks/usePriceItemsData';
import { useTimeEntries } from '../hooks/useTimeEntries';
import { useActiveTimer } from '../hooks/useActiveTimer';
import { createTaskCompletedNotification } from '../utils/notifications';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { Button } from '../components/ui/Button';
import { Dropdown } from '../components/ui/Dropdown';
import { BudgetBar } from '../components/ui/BudgetBar';
import AddTimeEntryPopup from '../components/timeTracking/AddTimeEntryPopup';

interface Task {
  id: string;
  name: string;
  statusdone: boolean;
  assignto: string;
  date: string;
  budget_total: number;
  services: Service[];
  sectionId: string;
  projectId: string;
}

interface Service {
  id: string;
  name: string;
  total_hours: number;
  total_eur: number;
  arbeiter: Worker[];
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  status: string;
  involvedUserIds?: string[];
}

interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  priceItemId: string;
  hours: number;
  userId: string;
  date: string;
}

interface PriceItem {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
  ordernum: number;
}

interface TaskWithDetails extends Task {
  customerName: string;
  projectName: string;
  totalEffort: number;
}

interface FilterState {
  status: string[];
  customer: string[];
  dueDate: string;
}

interface SortState {
  field: 'name' | 'customerName' | 'date' | 'totalEffort' | null;
  direction: 'asc' | 'desc';
}

const STATUS_OPTIONS = [
  { value: 'open', label: 'Offen' },
  { value: 'completed', label: 'Abgeschlossen' },
];

const DUE_DATE_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'overdue', label: 'Überfällig' },
  { value: 'today', label: 'Heute' },
  { value: 'this_week', label: 'Diese Woche' },
  { value: 'next_week', label: 'Nächste Woche' },
  { value: 'no_date', label: 'Ohne Datum' },
];

function MyTasks() {
  const { user } = useAuthState();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({ status: [], customer: [], dueDate: 'all' });
  const [sort, setSort] = useState<SortState>({ field: 'date', direction: 'asc' });
  
  // Filter dropdown states
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  const [isDueDateFilterOpen, setIsDueDateFilterOpen] = useState(false);
  
  // Track if user has manually interacted with filters
  const [hasUserInteractedWithFilters, setHasUserInteractedWithFilters] = useState(false);

  // Time tracking states
  const [showAddTimeEntryPopup, setShowAddTimeEntryPopup] = useState(false);
  const [preselectedEntryData, setPreselectedEntryData] = useState<{
    projectId: string;
    taskId: string;
  } | null>(null);

  // Use hooks for data management
  const {
    projects,
    allTasks,
    customerPricelists
  } = useProjectsData();

  const {
    priceItems: basicPriceItems
  } = usePriceItemsData();

  const {
    timeEntries,
    addTimeEntry
  } = useTimeEntries();

  const {
    createTimerEntry
  } = useActiveTimer(timeEntries, () => Promise.resolve());

  const tabs = [
    {
      label: 'Übersicht',
      path: '/mytasks',
      icon: ListTodo
    }
  ];

  // Helper functions
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

  // Handle task status toggle
  const handleTaskStatusToggle = async (taskId: string, projectId: string, statusdone: boolean) => {
    console.log('🔄 DEBUG: handleTaskStatusToggle called with:', { taskId, projectId, statusdone });
    try {
      // Get the current task to check if status is actually changing
      const currentTask = tasksWithDetails.find(task => task.id === taskId);
      if (!currentTask) {
        console.log('❌ DEBUG: Current task not found for taskId:', taskId);
        return;
      }
      
      console.log('📋 DEBUG: Current task status:', currentTask.statusdone);
      console.log('📋 DEBUG: New status:', statusdone);
      
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, { statusdone });
      
      // Send notification to project managers only when task status changes from false to true
      if (statusdone && !currentTask.statusdone && user) {
        console.log('🎯 DEBUG: Conditions met for sending notification');
        
        const project = projects.find(p => p.id === projectId);
        const task = allTasks[projectId]?.find(t => t.id === taskId);
        
        console.log('🏗️ DEBUG: Found project:', project);
        console.log('📋 DEBUG: Found task:', task);
        console.log('👥 DEBUG: Project PMUserIDs:', project?.PMUserIDs);
        
        if (project && task && project.PMUserIDs) {
          // Filter out the current user to avoid self-notification
          const projectManagersToNotify = project.PMUserIDs.filter(pmId => pmId !== user.uid);
          // ÄNDERUNG: Alle Projektmanager benachrichtigen, auch den Sender
          const projectManagersToNotify = project.PMUserIDs;
          console.log('👥 DEBUG: Project managers to notify (excluding sender):', projectManagersToNotify);
          console.log('👥 DEBUG: Project managers to notify (including sender):', projectManagersToNotify);
          
          // Send notification to each project manager
          for (const pmUserId of projectManagersToNotify) {
            console.log('📤 DEBUG: Sending notification to PM:', pmUserId);
            await createTaskCompletedNotification(
              pmUserId,
              user.uid,
              project.customerName,
              project.name,
              task.name,
              projectId,
              taskId
            );
          }
        } else {
          console.log('❌ DEBUG: Missing data for notification:');
          console.log('  - project exists:', !!project);
          console.log('  - task exists:', !!task);
          console.log('  - project.PMUserIDs exists:', !!project?.PMUserIDs);
        }
      } else {
        console.log('⏭️ DEBUG: Notification conditions not met:');
        console.log('  - statusdone:', statusdone);
        console.log('  - !currentTask.statusdone:', !currentTask.statusdone);
        console.log('  - user exists:', !!user);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Fehler beim Aktualisieren des Aufgabenstatus');
    }
  };

  const isTaskOverdue = (task: TaskWithDetails): boolean => {
    if (!task.date || task.statusdone) return false;
    
    const today = new Date();
    const dueDate = new Date(task.date);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return today > dueDate;
  };

  const isTaskDueToday = (task: TaskWithDetails): boolean => {
    if (!task.date) return false;
    
    const today = new Date();
    const dueDate = new Date(task.date);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === dueDate.getTime();
  };

  const isTaskDueThisWeek = (task: TaskWithDetails): boolean => {
    if (!task.date) return false;
    
    const today = new Date();
    const dueDate = new Date(task.date);
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);
    
    // Get start of week (Monday)
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Sunday)
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return dueDate >= startOfWeek && dueDate <= endOfWeek;
  };

  const isTaskDueNextWeek = (task: TaskWithDetails): boolean => {
    if (!task.date) return false;
    
    const today = new Date();
    const dueDate = new Date(task.date);
    const startOfNextWeek = new Date(today);
    const endOfNextWeek = new Date(today);
    
    // Get start of next week (Monday)
    const day = startOfNextWeek.getDay();
    const diff = startOfNextWeek.getDate() - day + (day === 0 ? -6 : 1) + 7;
    startOfNextWeek.setDate(diff);
    startOfNextWeek.setHours(0, 0, 0, 0);
    
    // Get end of next week (Sunday)
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    endOfNextWeek.setHours(23, 59, 59, 999);
    
    return dueDate >= startOfNextWeek && dueDate <= endOfNextWeek;
  };

  const searchTasks = (task: TaskWithDetails, searchTerm: string): boolean => {
    const term = searchTerm.toLowerCase();
    return (
      task.name.toLowerCase().includes(term) ||
      task.customerName.toLowerCase().includes(term) ||
      task.projectName.toLowerCase().includes(term)
    );
  };

  // Data fetching
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }, [user]);

  // Fetch tasks from all projects where user is involved
  useEffect(() => {
    if (!user || projects.length === 0) return;

    const userProjects = projects.filter(project => 
      project.involvedUserIds?.includes(user.uid) && project.status === 'active'
    );

    if (userProjects.length === 0) {
      setTasks([]);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    userProjects.forEach(project => {
      const tasksQuery = query(
        collection(db, `projects/${project.id}/tasks`),
        where('assignto', '==', user.uid)
      );
      
      const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          projectId: project.id,
          ...doc.data()
        })) as Task[];
        
        setTasks(prevTasks => {
          // Remove old tasks from this project and add new ones
          const otherProjectTasks = prevTasks.filter(task => task.projectId !== project.id);
          return [...otherProjectTasks, ...tasksData];
        });
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user, projects]);

  // Fetch customer-specific pricelists

  // Process tasks with project and customer information
  const tasksWithDetails = useMemo(() => {
    return tasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      
      // Calculate total effort from services
      const servicesTotal = task.services?.reduce((sum, service) => sum + service.total_eur, 0) || 0;
      
      // Calculate total effort from time entries
      const taskTimeEntries = timeEntries.filter(entry => entry.taskId === task.id);
      const availablePriceItems = project?.customerId && customerPricelists[project.customerId] 
        ? customerPricelists[project.customerId] 
        : basicPriceItems;
      
      const timeEntriesTotal = taskTimeEntries.reduce((sum, entry) => {
        const priceItem = availablePriceItems.find(item => item.id === entry.priceItemId);
        const hourlyRate = priceItem?.hourlyRate || 0;
        return sum + (entry.hours * hourlyRate);
      }, 0);
      
      const totalEffort = servicesTotal + timeEntriesTotal;

      return {
        ...task,
        customerName: project?.customerName || 'Unbekannter Kunde',
        projectName: project?.name || 'Unbekanntes Projekt',
        totalEffort
      } as TaskWithDetails;
    });
  }, [tasks, projects, timeEntries, basicPriceItems, customerPricelists]);

  // Computed values
  const uniqueCustomers = useMemo(() => {
    const customerSet = new Set<string>();
    tasksWithDetails.forEach(task => {
      if (task.customerName) {
        customerSet.add(task.customerName);
      }
    });
    return Array.from(customerSet).sort();
  }, [tasksWithDetails]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasksWithDetails];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task => searchTasks(task, searchTerm));
    }

    // Apply status filter - DEFAULT TO OPEN TASKS IF NO USER INTERACTION
    let statusFilterToApply = filters.status;
    
    if (!hasUserInteractedWithFilters && filters.status.length === 0) {
      statusFilterToApply = ['open', 'completed']; // Show both open and completed tasks by default
    }

    if (statusFilterToApply.length > 0) {
      filtered = filtered.filter(task => {
        const taskStatus = task.statusdone ? 'completed' : 'open';
        return statusFilterToApply.includes(taskStatus);
      });
    }

    // Apply customer filter
    if (filters.customer.length > 0) {
      filtered = filtered.filter(task => filters.customer.includes(task.customerName));
    }

    // Apply due date filter
    if (filters.dueDate !== 'all') {
      filtered = filtered.filter(task => {
        switch (filters.dueDate) {
          case 'overdue':
            return isTaskOverdue(task);
          case 'today':
            return isTaskDueToday(task);
          case 'this_week':
            return isTaskDueThisWeek(task);
          case 'next_week':
            return isTaskDueNextWeek(task);
          case 'no_date':
            return !task.date;
          default:
            return true;
        }
      });
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
          case 'date':
            // Use dueDate for sorting, fallback to startDate, then Infinity for tasks without dates
            aValue = a.date ? new Date(a.date).getTime() : Infinity;
            bValue = b.date ? new Date(b.date).getTime() : Infinity;
            break;
          case 'totalEffort':
            aValue = a.totalEffort;
            bValue = b.totalEffort;
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
  }, [tasksWithDetails, searchTerm, filters, sort, hasUserInteractedWithFilters]);

  // Event handlers
  const handleStatusFilterChange = (statusValue: string) => {
    setHasUserInteractedWithFilters(true);
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(statusValue)
        ? prev.status.filter(s => s !== statusValue)
        : [...prev.status, statusValue]
    }));
  };

  const handleCustomerFilterChange = (customerName: string) => {
    setHasUserInteractedWithFilters(true);
    setFilters(prev => ({
      ...prev,
      customer: prev.customer.includes(customerName)
        ? prev.customer.filter(c => c !== customerName)
        : [...prev.customer, customerName]
    }));
  };

  const handleDueDateFilterChange = (dueDateValue: string) => {
    setHasUserInteractedWithFilters(true);
    setFilters(prev => ({
      ...prev,
      dueDate: dueDateValue
    }));
    setIsDueDateFilterOpen(false);
  };

  const handleSortChange = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const clearAllFilters = () => {
    setHasUserInteractedWithFilters(true);
    setFilters({ status: [], customer: [], dueDate: 'all' });
    setSort({ field: null, direction: 'desc' });
  };

  const hasActiveFilters = hasUserInteractedWithFilters && (
    filters.status.length > 0 || 
    filters.customer.length > 0 || 
    filters.dueDate !== 'all' ||
    sort.field !== null
  );

  const handleRowClick = (task: TaskWithDetails) => {
    window.location.href = `/projects/${task.projectId}?tab=tasks`;
  };

  const handleTimeTrackingClick = (task: TaskWithDetails, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setPreselectedEntryData({
      projectId: task.projectId,
      taskId: task.id
    });
    setShowAddTimeEntryPopup(true);
  };

  const handleAddTimeEntry = async (newEntry: any) => {
    try {
      await addTimeEntry(newEntry);
      setShowAddTimeEntryPopup(false);
    } catch (err) {
      console.error('Error adding time entry:', err);
    }
  };

  const handleStartTimer = async (timerEntry: any) => {
    try {
      await createTimerEntry(timerEntry, addTimeEntry);
      setShowAddTimeEntryPopup(false);
    } catch (err) {
      console.error('Error starting timer:', err);
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

  const getDueDateLabel = () => {
    const option = DUE_DATE_OPTIONS.find(opt => opt.value === filters.dueDate);
    return option ? option.label : 'Alle';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e1dede] flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Meine Aufgaben"
          icon={ListTodo}
          tabs={tabs}
        />
        
        <div className="p-8">
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
                  placeholder="Suche nach Aufgaben..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 max-w-md"
                />
                
                {/* Status Filter */}
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                      <span className="text-gray-700">Status</span>
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
                  maxWidth="200px"
                >
                  <div className="py-2">
                    {STATUS_OPTIONS.map((option) => (
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

                {/* Due Date Filter */}
                <Dropdown
                  trigger={
                    <button className="flex items-center gap-2 px-3 py-2 h-10 text-sm bg-white-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">{getDueDateLabel()}</span>
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </button>
                  }
                  isOpen={isDueDateFilterOpen}
                  onOpenChange={setIsDueDateFilterOpen}
                  maxWidth="200px"
                >
                  <div className="py-2">
                    {DUE_DATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDueDateFilterChange(option.value)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                          option.value === filters.dueDate ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
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
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="pl-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      
                    </th>
                    <th className="px-3 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortChange('name')}
                        className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        AUFGABE
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
                      <button
                        onClick={() => handleSortChange('date')}
                        className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        FÄLLIGKEIT
                        {getSortIcon('date')}
                      </button>
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => handleSortChange('totalEffort')}
                        className="group flex items-center gap-1 hover:text-gray-700 transition-colors"
                      >
                        AUFWAND
                        {getSortIcon('totalEffort')}
                      </button>
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      ZEITERFASSUNG
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedTasks.map((task) => {
                    const isOverdue = isTaskOverdue(task);
                    const isDueToday = isTaskDueToday(task);

                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleRowClick(task)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors duration-150 ${
                          task.statusdone ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="pl-6 py-4 whitespace-nowrap w-10 text-center">
                          <input
                            type="checkbox"
                            checked={task.statusdone}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              handleTaskStatusToggle(task.id, task.projectId, e.target.checked);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{task.name}</div>
                            <div className="text-sm text-gray-500">{task.projectName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {task.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {task.date ? (
                            <span className={`${
                              isOverdue ? 'text-red-600 font-medium' : 
                              isDueToday ? 'text-orange-600 font-medium' : 
                              'text-gray-900'
                            }`}>
                              {formatDate(task.date)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left">
                          <div className="w-full max-w-[120px]">
                            <BudgetBar
                              totalValue={task.totalEffort}
                              budget={task.budget_total}
                              height="sm"
                              showPlaceholder={true}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center w-32">
                          <Button
                            variant="secondary"
                            icon={Clock}
                            onClick={(e) => handleTimeTrackingClick(task, e)}
                            className="text-xs px-2 py-1 h-8"
                          >
                            Zeit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAndSortedTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50"
                      >
                        {!user ? 'Bitte melden Sie sich an, um Ihre Aufgaben zu sehen' : 'Keine Aufgaben gefunden'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddTimeEntryPopup && (
        <AddTimeEntryPopup
          selectedDate={new Date()}
          projects={projects}
          allTasks={allTasks}
          priceItems={basicPriceItems}
          customerPricelists={customerPricelists}
          preselectedEntryData={preselectedEntryData}
          onClose={() => {
            setShowAddTimeEntryPopup(false);
            setPreselectedEntryData(null);
          }}
          onSave={handleAddTimeEntry}
          onStartTimer={handleStartTimer}
        />
      )}
    </div>
  );
}

export default MyTasks;