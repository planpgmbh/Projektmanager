import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProjectDescription from './ProjectDescription';
import ProjectBudgetCard from './ProjectBudgetCard';
import ProjectHoursTable from './ProjectHoursTable';
import ProjectWorkflow from './ProjectWorkflow';
import SelectOrCreateOfferPopup from './workflow/SelectOrCreateOfferPopup';
import ApproveOfferPopup from './workflow/ApproveOfferPopup';
import SelectOrCreateInvoicePopup from './workflow/SelectOrCreateInvoicePopup';
import ManageProjectPersonsPopup from './ManageProjectPersonsPopup';
import { Project, ProjectWorkflow as ProjectWorkflowType, User } from './ProjectDetailsTabTasks_Types';

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
}

interface ProcessedTimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  priceItemId: string;
  priceItemName: string;
  hourlyRate: number;
  hours: number;
  note: string;
  date: string;
  userId: string;
}

interface ProjectDetailsTabOverviewProps {
  project: Project;
  customers?: Customer[];
  timeEntries: ProcessedTimeEntry[];
  allUsers?: User[];
  onProjectUpdate: () => Promise<void>;
  onTeamUpdated?: () => void;
  onNavigateToTasks?: () => void;
}

function ProjectDetailsTabOverview({ 
  project, 
  customers = [], 
  timeEntries, 
  allUsers = [], 
  onProjectUpdate,
  onTeamUpdated,
  onNavigateToTasks
}: ProjectDetailsTabOverviewProps) {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [description, setDescription] = useState(project.description || '');
  const [budget, setBudget] = useState(project.totalBudget?.toString() || '0');
  const [isUpdating, setIsUpdating] = useState(false);
  const [budgetUpdateEffect, setBudgetUpdateEffect] = useState(false);

  // Workflow popup states
  const [showManageTeamPopup, setShowManageTeamPopup] = useState(false);
  const [showSelectOrCreateOfferPopup, setShowSelectOrCreateOfferPopup] = useState(false);
  const [showApproveOfferPopup, setShowApproveOfferPopup] = useState(false);
  const [showSelectOrCreateInvoicePopup, setShowSelectOrCreateInvoicePopup] = useState(false);

  // Update budget state when project changes
  useEffect(() => {
    setBudget(project.totalBudget?.toString() || '0');
  }, [project.totalBudget]);

  // Calculate total hours and value
  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalValue = timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.hourlyRate), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleDescriptionSave = async () => {
    try {
      setIsUpdating(true);
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, { description });
      await onProjectUpdate();
      setIsEditingDescription(false);
    } catch (err) {
      console.error('Error updating project description:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDescriptionCancel = () => {
    setDescription(project.description || '');
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleDescriptionSave();
    } else if (e.key === 'Escape') {
      handleDescriptionCancel();
    }
  };

  const handleBudgetSave = async () => {
    try {
      setIsUpdating(true);
      const budgetValue = parseFloat(budget) || 0;
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, { totalBudget: budgetValue });
      await onProjectUpdate();
      setIsEditingBudget(false);
    } catch (err) {
      console.error('Error updating project budget:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBudgetCancel = () => {
    setBudget(project.totalBudget?.toString() || '0');
    setIsEditingBudget(false);
  };

  const handleBudgetKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBudgetSave();
    } else if (e.key === 'Escape') {
      handleBudgetCancel();
    }
  };

  const handleImportFromOffer = async () => {
    const workflow = project.workflow;
    if (!workflow?.offerCreated?.offerId) return;

    try {
      setIsUpdating(true);
      
      // Fetch offer details from sevDesk
      const response = await fetch(`/api/orders/${workflow.offerCreated.offerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch offer details');
      }

      const data = await response.json();
      // Fix: Access the first element of the objects array
      const netAmount = parseFloat(data.objects[0]?.sumNet || '0');
      
      if (netAmount > 0) {
        // Update project budget with offer net amount
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, { totalBudget: netAmount });
        
        // Trigger visual effect
        setBudgetUpdateEffect(true);
        setTimeout(() => setBudgetUpdateEffect(false), 1000);
        
        // Refresh project data to show new budget
        await onProjectUpdate();
      }
    } catch (err) {
      console.error('Error importing budget from offer:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Workflow handlers
  const updateWorkflow = async (updates: Partial<ProjectWorkflowType>) => {
    try {
      const currentWorkflow = project.workflow || {
        teamInvited: { status: 'pending' },
        distributeTasks: { status: 'disabled' },
        offerCreated: { status: 'disabled' },
        offerApproved: { status: 'disabled' },
        invoiceCreated: { status: 'disabled' },
        invoicePaid: { status: 'disabled' },
        projectArchived: { status: 'disabled' }
      };

      const newWorkflow = { ...currentWorkflow, ...updates };
      
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, { workflow: newWorkflow });
      await onProjectUpdate();
    } catch (err) {
      console.error('Error updating workflow:', err);
    }
  };

  const handleManageTeam = () => {
    setShowManageTeamPopup(true);
  };

  const handleTeamSaved = async (updatedInvolvedUserIds: string[], updatedPMUserIds: string[]) => {
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, { 
        involvedUserIds: updatedInvolvedUserIds,
        PMUserIDs: updatedPMUserIds 
      });
      
      // Mark team invitation as completed and enable both distributeTasks and offerCreated
      await updateWorkflow({
        teamInvited: {
          status: 'completed',
          completedAt: new Date()
        },
        distributeTasks: { status: 'current' },
        offerCreated: { status: 'current' }
      });

      // Trigger team update effect after 2 seconds
      setTimeout(() => {
        onTeamUpdated?.();
      }, 2000);

      setShowManageTeamPopup(false);
    } catch (err) {
      console.error('Error updating team:', err);
      throw err;
    }
  };

  const handleSelectOrCreateOffer = () => {
    setShowSelectOrCreateOfferPopup(true);
  };

  const handleOfferSelected = async (offerId: string | null, offerNumber: string | null) => {
    if (offerId === null) {
      // No offer selected - skip offer steps, invoiceCreated becomes current
      await updateWorkflow({
        offerCreated: { status: 'skipped' },
        offerApproved: { status: 'skipped' },
        invoiceCreated: { status: 'current' }
      });
    } else {
      // Offer selected - normal flow
      await updateWorkflow({
        offerCreated: {
          status: 'completed',
          offerId,
          offerNumber,
          completedAt: new Date()
        },
        offerApproved: { status: 'current' }
      });
    }
  };

  const handleApproveOffer = () => {
    setShowApproveOfferPopup(true);
  };

  const handleOfferStatusChange = async (status: 'approved' | 'open') => {
    const offerApprovedStep: any = {
      status: status === 'approved' ? 'completed' as const : 'current' as const,
      offerStatus: status
    };

    // Only add completedAt if status is approved
    if (status === 'approved') {
      offerApprovedStep.completedAt = new Date();
    }

    const updates: Partial<ProjectWorkflowType> = {
      offerApproved: offerApprovedStep
    };

    if (status === 'approved') {
      updates.invoiceCreated = { status: 'current' };
    }

    // Update offer status in sevDesk
    const workflow = project.workflow;
    if (workflow?.offerCreated?.offerId) {
      try {
        // Determine the sevDesk status code
        const sevDeskStatus = status === 'approved' ? '500' : '200'; // 500 = Angenommen, 200 = Offen
        
        const response = await fetch(`/api/orders/${workflow.offerCreated.offerId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: sevDeskStatus })
        });

        if (!response.ok) {
          console.error('Error updating offer status in sevDesk:', response.status);
        }
      } catch (err) {
        console.error('Error updating offer status in sevDesk:', err);
      }
    }

    await updateWorkflow(updates);
  };

  const handleSelectOrCreateInvoice = () => {
    setShowSelectOrCreateInvoicePopup(true);
  };

  const handleInvoiceSelected = async (invoiceId: string, invoiceNumber: string) => {
    await updateWorkflow({
      invoiceCreated: {
        status: 'completed',
        invoiceId,
        invoiceNumber,
        completedAt: new Date()
      },
      invoicePaid: { status: 'current' }
    });
  };

  const handleArchiveProject = async () => {
    await updateWorkflow({
      projectArchived: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Also update project status to completed
    const projectRef = doc(db, 'projects', project.id);
    await updateDoc(projectRef, { status: 'completed' });
    await onProjectUpdate();
  };

  const handleResetStep = async (stepId: string) => {
    const currentWorkflow = project.workflow || {
      teamInvited: { status: 'pending' },
      distributeTasks: { status: 'disabled' },
      offerCreated: { status: 'disabled' },
      offerApproved: { status: 'disabled' },
      invoiceCreated: { status: 'disabled' },
      invoicePaid: { status: 'disabled' },
      projectArchived: { status: 'disabled' }
    };

    const stepOrder = ['teamInvited', 'distributeTasks', 'offerCreated', 'offerApproved', 'invoiceCreated', 'invoicePaid', 'projectArchived'];
    const resetIndex = stepOrder.indexOf(stepId);
    
    if (resetIndex === -1) return;

    const updates: Partial<ProjectWorkflowType> = {};

    // Reset the current step
    updates[stepId as keyof ProjectWorkflowType] = { status: 'pending' };

    // Reset all subsequent steps (but skip distributeTasks as it's independent)
    for (let i = resetIndex + 1; i < stepOrder.length; i++) {
      const nextStepId = stepOrder[i] as keyof ProjectWorkflowType;
      if (nextStepId !== 'distributeTasks') {
        updates[nextStepId] = { status: 'disabled' };
      }
    }

    // Set the correct current step
    if (resetIndex === 0) {
      updates.teamInvited = { status: 'current' };
    }

    await updateWorkflow(updates);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-8 bg-white min-h-screen">
        {/* Left Column - 2/3 width */}
        <div className="col-span-2 space-y-6">
          {/* Project Description */}
          <ProjectDescription
            description={description}
            isEditing={isEditingDescription}
            isUpdating={isUpdating}
            onDescriptionChange={setDescription}
            onStartEditing={() => setIsEditingDescription(true)}
            onSave={handleDescriptionSave}
            onCancel={handleDescriptionCancel}
            onKeyDown={handleDescriptionKeyDown}
          />

          {/* Cards Row */}
          <div className="grid grid-cols-2 gap-6">
            {/* Total Hours Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Totale Stunden</h3>
              <div className="text-3xl font-bold text-gray-900">{formatHours(totalHours)}</div>
              <div className="text-sm text-gray-500 mt-1">{formatCurrency(totalValue)}</div>
            </div>

            {/* Total Budget Card */}
            <ProjectBudgetCard
              project={project}
              totalValue={totalValue}
              isEditing={isEditingBudget}
              isUpdating={isUpdating}
              budget={budget}
              onBudgetChange={setBudget}
              onStartEditing={() => setIsEditingBudget(true)}
              onSave={handleBudgetSave}
              onCancel={handleBudgetCancel}
              onKeyDown={handleBudgetKeyDown}
              formatCurrency={formatCurrency}
              budgetUpdateEffect={budgetUpdateEffect}
              onImportFromOffer={handleImportFromOffer}
            />
          </div>

          {/* Hours Table */}
          <ProjectHoursTable
            timeEntries={timeEntries}
            allUsers={allUsers}
            formatHours={formatHours}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="bg-gray-50 p-6 space-y-8">
          {/* Project Workflow */}
          <ProjectWorkflow 
            project={project}
            onManageTeam={handleManageTeam}
            onSelectOrCreateOffer={handleSelectOrCreateOffer}
            onApproveOffer={handleApproveOffer}
            onSelectOrCreateInvoice={handleSelectOrCreateInvoice}
            onArchiveProject={handleArchiveProject}
            onResetStep={handleResetStep}
            onNavigateToTasks={onNavigateToTasks}
          />
        </div>
      </div>

      {/* Workflow Popups */}
      {showManageTeamPopup && (
        <ManageProjectPersonsPopup
          project={project}
          allUsers={allUsers}
          onClose={() => setShowManageTeamPopup(false)}
          onSave={handleTeamSaved}
        />
      )}

      {showSelectOrCreateOfferPopup && (
        <SelectOrCreateOfferPopup
          customerId={project.customerId}
          onClose={() => setShowSelectOrCreateOfferPopup(false)}
          onSelectOffer={handleOfferSelected}
          onResetStep={() => handleResetStep('offerCreated')}
        />
      )}

      {showApproveOfferPopup && (
        <ApproveOfferPopup
          currentStatus={project.workflow?.offerApproved?.offerStatus || 'open'}
          offerNumber={project.workflow?.offerCreated?.offerNumber}
          onClose={() => setShowApproveOfferPopup(false)}
          onStatusChange={handleOfferStatusChange}
          onResetStep={() => handleResetStep('offerApproved')}
        />
      )}

      {showSelectOrCreateInvoicePopup && (
        <SelectOrCreateInvoicePopup
          customerId={project.customerId}
          offerId={project.workflow?.offerCreated?.offerId}
          onClose={() => setShowSelectOrCreateInvoicePopup(false)}
          onSelectInvoice={handleInvoiceSelected}
          onResetStep={() => handleResetStep('invoiceCreated')}
        />
      )}
    </>
  );
}

export default ProjectDetailsTabOverview;