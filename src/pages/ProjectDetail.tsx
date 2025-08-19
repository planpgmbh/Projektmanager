import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, onSnapshot, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FolderKanban, ListTodo, Kanban } from 'lucide-react';
import { useAuthState } from '../hooks/useAuthState';
import { useUserRole } from '../hooks/useUserRole';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import ProjectDetailsTabOverview from '../components/projects/ProjectDetailsTabOverview';
import ProjectDetailsTabTasks from '../components/projects/ProjectDetailsTabTasks';
import ProjectDetailsTabPlanner from '../components/projects/ProjectDetailsTabPlanner';
import ManageProjectPersonsPopup from '../components/projects/ManageProjectPersonsPopup';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Project, User } from '../components/projects/ProjectDetailsTabTasks_Types';

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
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

interface ProcessedTimeEntry extends TimeEntry {
  priceItemName: string;
  hourlyRate: number;
}

type TabType = 'overview' | 'tasks' | 'planner';

const statusOptions = [
  { value: 'active', label: 'Aktiv' },
  { value: 'completed', label: 'Abgeschlossen' },
  { value: 'paused', label: 'Pausiert' },
  { value: 'cancelled', label: 'Abgebrochen' },
];

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthState();
  const { role } = useUserRole(user);
  const [project, setProject] = useState<Project | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [basicPriceItems, setBasicPriceItems] = useState<PriceItem[]>([]);
  const [customerPricelists, setCustomerPricelists] = useState<{ [customerId: string]: PriceItem[] }>({});
  const [processedTimeEntries, setProcessedTimeEntries] = useState<ProcessedTimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showManagePersonsPopup, setShowManagePersonsPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamUpdateEffect, setTeamUpdateEffect] = useState(false);

  // Check if user can see budget column
  const canSeeBudget = role === 'projektmanager' || role === 'admin';

  const tabs = [
    {
      label: 'Übersicht',
      path: `/projects/${projectId}`,
      icon: FolderKanban
    },
    {
      label: 'Aufgaben',
      path: `/projects/${projectId}?tab=tasks`,
      icon: ListTodo
    },
    {
      label: 'Planner',
      path: `/projects/${projectId}?tab=planner`,
      icon: Kanban
    }
  ];

  const getCurrentTab = (): TabType => {
    const tab = searchParams.get('tab');
    if (tab === 'tasks' || tab === 'planner') {
      return tab;
    }
    return 'overview';
  };

  const fetchProject = async () => {
    if (!projectId) return;

    console.log('🔍 DEBUG: fetchProject called for projectId:', projectId);

    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data()
        } as Project;

        console.log('📊 DEBUG: Project data loaded from Firebase:', projectData);
        console.log('🔧 DEBUG: Project workflow object:', projectData.workflow);

        // Convert Firestore Timestamps to Date objects in workflow
        if (projectData.workflow) {
          const convertedWorkflow = { ...projectData.workflow };
          
          Object.keys(convertedWorkflow).forEach(stepKey => {
            const step = convertedWorkflow[stepKey as keyof typeof convertedWorkflow];
            if (step && step.completedAt && typeof step.completedAt.toDate === 'function') {
              step.completedAt = step.completedAt.toDate();
            }
          });
          
          projectData.workflow = convertedWorkflow;
        }

        let workflowNeedsUpdate = false;
        const updatedWorkflow = { ...projectData.workflow };

        // Check offer status in sevDesk and update workflow if needed
        // ONLY if offerApproved is still 'current' (not completed)
        const offerId = projectData.workflow?.offerCreated?.offerId;
        const offerApprovedStatus = projectData.workflow?.offerApproved?.status;
        
        console.log('📋 DEBUG: Checking for offer ID:', offerId);
        console.log('📋 DEBUG: Offer workflow step status:', offerApprovedStatus);

        if (offerId && offerApprovedStatus === 'current') {
          console.log('🌐 DEBUG: Making API request to fetch offer status for ID:', offerId);
          
          try {
            const offerResponse = await fetch(`/api/orders/${offerId}`);
            console.log('📡 DEBUG: Offer API response status:', offerResponse.ok, offerResponse.status);
            
            if (offerResponse.ok) {
              const offerData = await offerResponse.json();
              console.log('📄 DEBUG: Full offer data received:', offerData);
              
              // Access the first element of the objects array
              const sevDeskOfferStatus = parseInt(offerData.objects[0]?.status || '0', 10);
              console.log('📋 DEBUG: SevDesk offer status:', sevDeskOfferStatus);
              
              // If offer is accepted (status 500), update workflow to completed
              if (sevDeskOfferStatus === 500) {
                console.log('✅ DEBUG: Offer is accepted (500) - updating workflow to completed');
                
                updatedWorkflow.offerApproved = {
                  status: 'completed',
                  offerStatus: 'approved',
                  completedAt: new Date()
                };
                
                // Also enable invoice creation
                updatedWorkflow.invoiceCreated = { status: 'current' };
                workflowNeedsUpdate = true;
                
                console.log('✅ DEBUG: Offer detected as accepted, updating workflow to completed');
              } else {
                console.log('⚪ DEBUG: Offer not yet accepted. Status:', sevDeskOfferStatus);
              }
            } else {
              console.error('❌ DEBUG: Offer API request failed with status:', offerResponse.status);
            }
          } catch (err) {
            console.error('❌ DEBUG: Error checking offer status:', err);
          }
        } else if (offerApprovedStatus === 'completed') {
          console.log('⚪ DEBUG: Offer workflow already completed, skipping status check to prevent regression');
        } else {
          console.log('⚪ DEBUG: No offer ID found or offer workflow not current, skipping offer status check');
        }

        // Check invoice status in sevDesk and update workflow if needed
        // ONLY if invoicePaid is still 'current' (not completed)
        const invoiceId = projectData.workflow?.invoiceCreated?.invoiceId;
        const invoicePaidStatus = projectData.workflow?.invoicePaid?.status;
        
        console.log('💰 DEBUG: Checking for invoice ID:', invoiceId);
        console.log('💰 DEBUG: Invoice workflow step status:', invoicePaidStatus);

        if (invoiceId && invoicePaidStatus === 'current') {
          console.log('🌐 DEBUG: Making API request to fetch invoice status for ID:', invoiceId);
          
          try {
            const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
            console.log('📡 DEBUG: Invoice API response status:', invoiceResponse.ok, invoiceResponse.status);
            
            if (invoiceResponse.ok) {
              const invoiceData = await invoiceResponse.json();
              console.log('📄 DEBUG: Full invoice data received:', invoiceData);
              
              // Fix: Access the first element of the objects array
              const sevDeskInvoiceStatus = parseInt(invoiceData.objects[0]?.status || '0', 10);
              console.log('💳 DEBUG: SevDesk invoice status:', sevDeskInvoiceStatus);
              
              // If invoice is paid (status 400 OR 1000), update workflow to completed
              if (sevDeskInvoiceStatus === 400 || sevDeskInvoiceStatus === 1000) {
                console.log('✅ DEBUG: Invoice is paid (400 or 1000) - updating workflow to completed');
                
                updatedWorkflow.invoicePaid = {
                  status: 'completed',
                  invoiceStatus: 'paid',
                  completedAt: new Date()
                };
                
                // Also enable project archiving
                updatedWorkflow.projectArchived = { status: 'current' };
                workflowNeedsUpdate = true;
                
                console.log('✅ DEBUG: Invoice detected as paid, updating workflow to completed');
              } else {
                console.log('⚪ DEBUG: Invoice not yet paid. Status:', sevDeskInvoiceStatus);
              }
            } else {
              console.error('❌ DEBUG: Invoice API request failed with status:', invoiceResponse.status);
            }
          } catch (err) {
            console.error('❌ DEBUG: Error checking invoice status:', err);
          }
        } else if (invoicePaidStatus === 'completed') {
          console.log('⚪ DEBUG: Invoice workflow already completed, skipping status check to prevent regression');
        } else {
          console.log('⚪ DEBUG: No invoice ID found or invoice workflow not current, skipping invoice status check');
        }

        // Save workflow changes to Firebase if needed
        if (workflowNeedsUpdate) {
          console.log('💾 DEBUG: Saving workflow changes to Firebase...');
          try {
            await updateDoc(projectRef, { workflow: updatedWorkflow });
            projectData.workflow = updatedWorkflow;
            console.log('✅ DEBUG: Workflow successfully updated in Firebase');
          } catch (updateError) {
            console.error('❌ DEBUG: Error updating workflow in Firebase:', updateError);
          }
        }

        setProject(projectData);
        setEditedTitle(projectData.name);
      } else {
        console.error('❌ DEBUG: Project document does not exist');
        setError('Projekt nicht gefunden');
      }
    } catch (err) {
      console.error('❌ DEBUG: Error fetching project:', err);
      setError('Fehler beim Laden des Projekts');
    }
  };

  // Mark distributeTasks as completed when navigating to tasks tab
  const markDistributeTasksCompleted = async () => {
    if (!project || !projectId) return;

    const workflow = project.workflow;
    const distributeTasksStep = workflow?.distributeTasks;
    
    // If distributeTasks step exists and is not already completed, mark it as completed
    if (distributeTasksStep && distributeTasksStep.status !== 'completed') {
      try {
        const currentWorkflow = project.workflow || {
          teamInvited: { status: 'pending' },
          offerCreated: { status: 'disabled' },
          offerApproved: { status: 'disabled' },
          distributeTasks: { status: 'pending' },
          invoiceCreated: { status: 'disabled' },
          invoicePaid: { status: 'disabled' },
          projectArchived: { status: 'disabled' }
        };

        const newWorkflow = {
          ...currentWorkflow,
          distributeTasks: {
            status: 'completed' as const,
            completedAt: new Date()
          }
        };
        
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { workflow: newWorkflow });
        await fetchProject();
      } catch (err) {
        console.error('Error updating distributeTasks workflow:', err);
      }
    }
  };

  // Handle tab changes and mark distributeTasks as completed when navigating to tasks tab
  useEffect(() => {
    const currentTab = getCurrentTab();
    
    if (currentTab === 'tasks') {
      markDistributeTasksCompleted();
    }
  }, [searchParams, project, projectId]);

  useEffect(() => {
    if (!projectId) return;

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

    // Fetch all users from Firebase
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setAllUsers(usersData);
    });

    // Fetch time entries for this project
    const timeEntriesQuery = query(
      collection(db, 'timeEntries'),
      where('projectId', '==', projectId),
      orderBy('date', 'desc')
    );

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

    Promise.all([fetchCustomers(), fetchProject()])
      .finally(() => setIsLoading(false));

    return () => {
      unsubscribeUsers();
      unsubscribeTimeEntries();
      unsubscribeBasicPriceItems();
    };
  }, [projectId]);

  // Fetch customer-specific pricelist when project is loaded
  useEffect(() => {
    if (!project?.customerId) return;

    const customerPricelistQuery = query(
      collection(db, `clients/${project.customerId}/pricelist`),
      orderBy('ordernum')
    );
    
    const unsubscribe = onSnapshot(customerPricelistQuery, (snapshot) => {
      const customerPricelistData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PriceItem[];
      
      setCustomerPricelists(prev => ({
        ...prev,
        [project.customerId]: customerPricelistData
      }));
    }, (error) => {
      console.log(`No customer-specific pricelist found for customer ${project.customerId}`);
    });

    return () => unsubscribe();
  }, [project?.customerId]);

  // Process time entries with price item information
  useEffect(() => {
    if (!timeEntries.length || (!basicPriceItems.length && (!project?.customerId || !customerPricelists[project.customerId]))) {
      setProcessedTimeEntries([]);
      return;
    }

    // Determine available price items (customer-specific or basic)
    const availablePriceItems = project?.customerId && customerPricelists[project.customerId] 
      ? customerPricelists[project.customerId] 
      : basicPriceItems;

    const processed = timeEntries.map(entry => {
      const priceItem = availablePriceItems.find(item => item.id === entry.priceItemId);
      
      return {
        ...entry,
        priceItemName: priceItem?.name || 'Unbekannte Leistung',
        hourlyRate: priceItem?.hourlyRate || 0
      };
    });

    setProcessedTimeEntries(processed);
  }, [timeEntries, basicPriceItems, customerPricelists, project?.customerId]);

  const handleTitleClick = () => {
    if (project) {
      setIsEditingTitle(true);
      setEditedTitle(project.name);
    }
  };

  const handleTitleChange = (value: string) => {
    setEditedTitle(value);
  };

  const handleTitleSave = async () => {
    if (!projectId || !project || editedTitle.trim() === '' || editedTitle === project.name) {
      setIsEditingTitle(false);
      setEditedTitle(project?.name || '');
      return;
    }

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { name: editedTitle.trim() });
      await fetchProject();
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Error updating project title:', err);
      setError('Fehler beim Speichern des Projektnamens');
      setIsEditingTitle(false);
      setEditedTitle(project?.name || '');
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle(project?.name || '');
  };

  const handleProjectUpdate = async () => {
    await fetchProject();
  };

  const handleManagePersonsClick = () => {
    setShowManagePersonsPopup(true);
  };

  const handleSaveInvolvedPersons = async (updatedInvolvedUserIds: string[], updatedPMUserIds: string[]) => {
    if (!projectId) return;

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { 
        involvedUserIds: updatedInvolvedUserIds,
        PMUserIDs: updatedPMUserIds 
      });
      await fetchProject();
    } catch (err) {
      console.error('Error updating involved persons:', err);
      setError('Fehler beim Speichern der beteiligten Personen');
      throw err;
    }
  };

  const handleTeamUpdated = () => {
    setTeamUpdateEffect(true);
    setTimeout(() => setTeamUpdateEffect(false), 3000);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!projectId || !project) return;

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, { status: newStatus });
      await fetchProject();
    } catch (err) {
      console.error('Error updating project status:', err);
      setError('Fehler beim Ändern des Status');
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    if (!projectId || !project) return;

    try {
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (!selectedCustomer) return;

      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerNumber: selectedCustomer.customerNumber
      });
      await fetchProject();
    } catch (err) {
      console.error('Error updating project customer:', err);
      setError('Fehler beim Ändern des Kunden');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;

    try {
      await deleteDoc(doc(db, 'projects', projectId));
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Fehler beim Löschen des Projekts');
    }
  };

  const handleNavigateToTasks = () => {
    setSearchParams({ tab: 'tasks' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-4">
            {error || 'Projekt nicht gefunden'}
          </div>
        </div>
      </div>
    );
  }

  const currentTab = getCurrentTab();

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName={project.name}
          icon={FolderKanban}
          tabs={tabs}
          isEditingTitle={isEditingTitle}
          editedTitle={editedTitle}
          onTitleClick={handleTitleClick}
          onTitleChange={handleTitleChange}
          onTitleSave={handleTitleSave}
          onTitleCancel={handleTitleCancel}
          project={project}
          allUsers={allUsers}
          onManagePersonsClick={handleManagePersonsClick}
          customers={customers}
          statusOptions={statusOptions}
          onStatusChange={handleStatusChange}
          onCustomerChange={handleCustomerChange}
          onDeleteProject={() => setShowDeleteConfirm(true)}
          teamUpdateEffect={teamUpdateEffect}
        />

        <div className="p-8">
          {currentTab === 'overview' && (
            <ProjectDetailsTabOverview 
              project={project} 
              customers={customers}
              timeEntries={processedTimeEntries}
              allUsers={allUsers}
              onProjectUpdate={handleProjectUpdate}
              onTeamUpdated={handleTeamUpdated}
              onNavigateToTasks={handleNavigateToTasks}
            />
          )}
          {currentTab === 'tasks' && (
            <ProjectDetailsTabTasks 
              customerId={project.customerId}
              customerName={project.customerName}
              projectName={project.name}
              projectId={project.id}
              project={project}
              timeEntries={processedTimeEntries}
              basicPriceItems={basicPriceItems}
              customerPricelists={customerPricelists}
              canSeeBudget={canSeeBudget}
            />
          )}
          {currentTab === 'planner' && <ProjectDetailsTabPlanner />}
        </div>
      </div>

      {showManagePersonsPopup && (
        <ManageProjectPersonsPopup
          project={project}
          allUsers={allUsers}
          onClose={() => setShowManagePersonsPopup(false)}
          onSave={handleSaveInvolvedPersons}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Projekt löschen"
        message={`Möchten Sie das Projekt "${project.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

export default ProjectDetail;