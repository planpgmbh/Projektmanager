import React, { useState } from 'react';
import { FileText, CheckCircle, Receipt, DollarSign, Archive, Users, ClipboardList } from 'lucide-react';
import { Project, WorkflowStep } from './ProjectDetailsTabTasks_Types';

interface ProjectWorkflowProps {
  project: Project;
  onSelectOrCreateOffer: () => void;
  onApproveOffer: () => void;
  onSelectOrCreateInvoice: () => void;
  onArchiveProject: () => void;
  onManageTeam: () => void;
  onResetStep: (stepId: string) => void;
  onNavigateToTasks?: () => void;
}

const workflowSteps = [
  { 
    id: 'teamInvited', 
    labelActive: 'Projektteam einladen',
    labelCompleted: 'Projektteam eingeladen',
    icon: Users,
    description: 'Projektteam zusammenstellen und einladen'
  },
  { 
    id: 'distributeTasks', 
    labelActive: 'Aufgaben verteilen',
    labelCompleted: 'Aufgaben verteilt',
    icon: ClipboardList,
    description: 'Aufgaben an Teammitglieder verteilen'
  },
  { 
    id: 'offerCreated', 
    labelActive: 'Angebot erstellen',
    labelCompleted: 'Angebot erstellt',
    icon: FileText,
    description: 'Angebot für das Projekt erstellen'
  },
  { 
    id: 'offerApproved', 
    labelActive: 'Angebot freigeben',
    labelCompleted: 'Angebot freigegeben',
    icon: CheckCircle,
    description: 'Angebot vom Kunden freigegeben'
  },
  { 
    id: 'invoiceCreated', 
    labelActive: 'Rechnung erstellen',
    labelCompleted: 'Rechnung erstellt',
    icon: Receipt,
    description: 'Rechnung für das Projekt erstellen'
  },
  { 
    id: 'invoicePaid', 
    labelActive: 'Rechnung offen',
    labelCompleted: 'Rechnung bezahlt',
    icon: DollarSign,
    description: 'Rechnung wurde bezahlt'
  },
  { 
    id: 'projectArchived', 
    labelActive: 'Projekt archivieren',
    labelCompleted: 'Projekt archiviert',
    icon: Archive,
    description: 'Projekt abschließen und archivieren'
  },
];

function ProjectWorkflow({ 
  project, 
  onSelectOrCreateOffer,
  onApproveOffer,
  onSelectOrCreateInvoice,
  onArchiveProject,
  onManageTeam,
  onResetStep,
  onNavigateToTasks
}: ProjectWorkflowProps) {

  const getStepStatus = (stepId: string): 'pending' | 'current' | 'completed' | 'disabled' | 'skipped' => {
    const workflow = project.workflow;
    
    if (!workflow) {
      return stepId === 'teamInvited' ? 'current' : 'disabled';
    }

    const step = workflow[stepId as keyof typeof workflow];
    
    if (step?.status === 'completed' || step?.status === 'skipped') {
      return step.status;
    }

    // Determine if step should be current or disabled based on previous steps
    switch (stepId) {
      case 'teamInvited':
        return step?.status === 'current' ? 'current' : 'pending';
      
      case 'distributeTasks':
        // distributeTasks becomes current when teamInvited is completed
        return workflow.teamInvited?.status === 'completed' 
          ? (step?.status === 'current' ? 'current' : 'pending')
          : 'disabled';
      
      case 'offerCreated':
        // offerCreated becomes current when teamInvited is completed
        return workflow.teamInvited?.status === 'completed' 
          ? (step?.status === 'current' ? 'current' : 'pending')
          : 'disabled';
      
      case 'offerApproved':
        // Skip if offer was skipped
        if (workflow.offerCreated?.status === 'skipped') {
          return 'skipped';
        }
        return workflow.offerCreated?.status === 'completed' 
          ? (step?.status === 'current' ? 'current' : 'pending')
          : 'disabled';
      
      case 'invoiceCreated':
        // invoiceCreated becomes current when:
        // 1. Either offer was skipped OR offer was approved
        const offerSkipped = workflow.offerCreated?.status === 'skipped';
        const offerApproved = workflow.offerApproved?.status === 'completed';
        
        if (offerSkipped || offerApproved) {
          return step?.status === 'current' ? 'current' : 'pending';
        }
        
        return 'disabled';
      
      case 'invoicePaid':
        return workflow.invoiceCreated?.status === 'completed'
          ? (step?.status === 'current' ? 'current' : 'pending')
          : 'disabled';
      
      case 'projectArchived':
        return workflow.invoicePaid?.status === 'completed'
          ? (step?.status === 'current' ? 'current' : 'pending')
          : 'disabled';
      
      default:
        return 'disabled';
    }
  };

  const isStepClickable = (stepId: string): boolean => {
    const status = getStepStatus(stepId);
    return status === 'current' || status === 'pending' || status === 'completed' || status === 'skipped';
  };

  const handleStepClick = (stepId: string) => {
    if (!isStepClickable(stepId)) return;

    // Always open the respective popup/action
    switch (stepId) {
      case 'teamInvited':
        onManageTeam();
        break;
      case 'distributeTasks':
        onNavigateToTasks?.();
        break;
      case 'offerCreated':
        onSelectOrCreateOffer();
        break;
      case 'offerApproved':
        onApproveOffer();
        break;
      case 'invoiceCreated':
        onSelectOrCreateInvoice();
        break;
      case 'invoicePaid':
        // Open invoice in sevDesk instead of popup
        const sevDeskLink = getSevDeskLink('invoiceCreated');
        if (sevDeskLink) {
          window.open(sevDeskLink, '_blank');
        }
        break;
      case 'projectArchived':
        onArchiveProject();
        break;
    }
  };

  const getStepColors = (stepId: string) => {
    const status = getStepStatus(stepId);
    
    switch (status) {
      case 'completed':
        return {
          icon: 'text-gray-900',
          text: 'text-gray-900 font-medium',
          line: 'bg-gray-700'
        };
      case 'current':
        return {
          icon: 'text-blue-600',
          text: 'text-blue-700 font-medium',
          line: 'bg-gray-200'
        };
      case 'pending':
        return {
          icon: 'text-gray-600',
          text: 'text-gray-700',
          line: 'bg-gray-200'
        };
      case 'skipped':
        return {
          icon: 'text-gray-400',
          text: 'text-gray-500',
          line: 'bg-gray-200'
        };
      case 'disabled':
      default:
        return {
          icon: 'text-gray-300',
          text: 'text-gray-400',
          line: 'bg-gray-200'
        };
    }
  };

  const getSevDeskLink = (stepId: string) => {
    const workflow = project.workflow;
    if (!workflow) return null;

    switch (stepId) {
      case 'offerCreated':
      case 'offerApproved':
        if (workflow.offerCreated?.offerId) {
          return `https://my.sevdesk.de/om/edit/type/AN/id/${workflow.offerCreated.offerId}`;
        }
        break;
      case 'invoiceCreated':
      case 'invoicePaid':
        if (workflow.invoiceCreated?.invoiceId) {
          return `https://my.sevdesk.de/fi/edit/type/RE/id/${workflow.invoiceCreated.invoiceId}`;
        }
        break;
    }
    return null;
  };

  const getStepDisplayText = (stepId: string) => {
    const status = getStepStatus(stepId);
    const step = workflowSteps.find(step => step.id === stepId);
    
    if (!step) return '';
    
    if (stepId === 'offerCreated' && status === 'skipped') {
      return 'Kein Angebot verknüpft';
    }
    
    // Use completed label if step is completed, otherwise use active label
    return status === 'completed' ? step.labelCompleted : step.labelActive;
  };

  const getLinkedDocumentInfo = (stepId: string) => {
    const workflow = project.workflow;
    if (!workflow) return null;

    if ((stepId === 'offerCreated' || stepId === 'offerApproved') && workflow.offerCreated?.offerNumber) {
      const relevantStep = stepId === 'offerApproved' ? workflow.offerApproved : workflow.offerCreated;
      return {
        number: workflow.offerCreated.offerNumber,
        date: relevantStep?.completedAt
      };
    }
    
    if ((stepId === 'invoiceCreated' || stepId === 'invoicePaid') && workflow.invoiceCreated?.invoiceNumber) {
      const relevantStep = stepId === 'invoicePaid' ? workflow.invoicePaid : workflow.invoiceCreated;
      return {
        number: workflow.invoiceCreated.invoiceNumber,
        date: relevantStep?.completedAt
      };
    }

    if (stepId === 'teamInvited' && workflow.teamInvited?.completedAt) {
      return {
        number: null,
        date: workflow.teamInvited.completedAt
      };
    }

    if (stepId === 'distributeTasks' && workflow.distributeTasks?.completedAt) {
      return {
        number: null,
        date: workflow.distributeTasks.completedAt
      };
    }

    return null;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short'
    }).format(date);
  };

  const handleDocumentClick = (stepId: string) => {
    const sevDeskLink = getSevDeskLink(stepId);
    if (sevDeskLink) {
      window.open(sevDeskLink, '_blank');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Projekt-Workflow</h3>
      <div className="space-y-4">
        {workflowSteps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const colors = getStepColors(step.id);
          const isClickable = isStepClickable(step.id);
          const IconComponent = step.icon;
          const linkedDocument = getLinkedDocumentInfo(step.id);
          const isCurrent = stepStatus === 'current';

          // Hide completed teamInvited step
          if (step.id === 'teamInvited' && stepStatus === 'completed') {
            return null;
          }

          // Hide completed distributeTasks step
          if (step.id === 'distributeTasks' && stepStatus === 'completed') {
            return null;
          }

          // Hide offerApproved step if offer was skipped
          if (step.id === 'offerApproved' && getStepStatus('offerCreated') === 'skipped') {
            return null;
          }

          return (
            <div key={step.id} className="flex items-start">
              {/* Icon Column */}
              <div className="flex flex-col items-center mr-4">
                <div className={`w-6 h-6 flex items-center justify-center ${isCurrent ? 'animate-pulse-grow' : ''}`}>
                  <IconComponent className={`w-4 h-4 ${colors.icon}`} />
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className={`w-px h-6 mt-2 ${colors.line}`} />
                )}
              </div>
              
              {/* Content Column */}
              <div className="flex-1 min-w-0 pb-2">
                {/* Step Text - Always clickable if actionable */}
                <div
                  className={`${colors.text} ${isClickable ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
                  onClick={() => handleStepClick(step.id)}
                >
                  {getStepDisplayText(step.id)}
                </div>

                {/* Linked Document Info - Separate line below, clickable */}
                {linkedDocument && (
                  <div className="mt-1 flex items-center gap-4">
                    {linkedDocument.number && (
                      <span 
                        className="text-xs text-gray-400 font-medium cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => handleDocumentClick(step.id)}
                        title="In sevDesk öffnen"
                      >
                        {linkedDocument.number}
                      </span>
                    )}
                    {linkedDocument.date && (
                      <span className="text-xs text-gray-400">
                        {formatDate(linkedDocument.date)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProjectWorkflow;