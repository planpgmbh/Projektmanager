import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { User, Project } from './projects/ProjectDetailsTabTasks_Types';
import { Dropdown } from './ui/Dropdown';
import { TeamMembers } from './ui/TeamMembers';

interface Tab {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageHeaderProps {
  pageName: string;
  icon: React.ComponentType<{ className?: string }>;
  tabs?: Tab[];
  isEditingTitle?: boolean;
  editedTitle?: string;
  onTitleClick?: () => void;
  onTitleChange?: (value: string) => void;
  onTitleSave?: () => void;
  onTitleCancel?: () => void;
  project?: Project;
  allUsers?: User[];
  onManagePersonsClick?: () => void;
  onProjectMenuAction?: (action: 'status' | 'customer' | 'delete') => void;
  customers?: Array<{ id: string; name: string; customerNumber: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  onStatusChange?: (status: string) => void;
  onCustomerChange?: (customerId: string) => void;
  onDeleteProject?: () => void;
  teamUpdateEffect?: boolean;
}

function PageHeader({ 
  pageName, 
  icon: Icon, 
  tabs = [],
  isEditingTitle = false,
  editedTitle = '',
  onTitleClick,
  onTitleChange,
  onTitleSave,
  onTitleCancel,
  project,
  allUsers = [],
  onManagePersonsClick,
  customers = [],
  statusOptions = [],
  onStatusChange,
  onCustomerChange,
  onDeleteProject,
  teamUpdateEffect = false
}: PageHeaderProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  const [isProjectMenuOpen, setIsProjectMenuOpen] = React.useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = React.useState(false);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onTitleSave?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onTitleCancel?.();
    }
  };

  const getInvolvedUsers = () => {
    if (!project?.involvedUserIds || !allUsers.length) return [];
    return allUsers.filter(user => project.involvedUserIds?.includes(user.id));
  };

  const getStatusLabel = (status: string) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unbekannter Kunde';
  };

  // Check if team members should be displayed
  const shouldShowTeamMembers = project && 
    project.workflow?.teamInvited?.status === 'completed' && 
    allUsers.length > 0 && 
    onManagePersonsClick;
  
  return (
    <div className="bg-white border-b">
      <div className="px-8 h-[90px] flex flex-col justify-between py-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-gray-900" />
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => onTitleChange?.(e.target.value)}
                  onBlur={onTitleSave}
                  onKeyDown={handleKeyDown}
                  className="text-2xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 -mx-1"
                  autoFocus
                />
              ) : (
                <h1 
                  className="text-2xl font-semibold cursor-pointer hover:text-blue-600 transition-colors duration-150"
                  onClick={onTitleClick}
                >
                  {pageName}
                </h1>
              )}
              
              {/* Project Menu (Three Dots) - Right next to title */}
              {project && (
                <div className="relative">
                  <Dropdown
                    trigger={
                      <button
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
                        title="Projektoptionen"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      </button>
                    }
                    isOpen={isProjectMenuOpen}
                    onOpenChange={setIsProjectMenuOpen}
                    placement="bottom-left"
                  >
                    <div className="py-1 w-48">
                      {/* Status Change */}
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        Status ändern
                      </div>
                      <Dropdown
                        trigger={
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                            <span>Status: {getStatusLabel(project.status)}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        isOpen={isStatusDropdownOpen}
                        onOpenChange={setIsStatusDropdownOpen}
                        placement="bottom-right"
                      >
                        <div className="py-1">
                          {statusOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => {
                                onStatusChange?.(option.value);
                                setIsStatusDropdownOpen(false);
                                setIsProjectMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                option.value === project.status ? 'font-semibold text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </Dropdown>

                      {/* Customer Change */}
                      <Dropdown
                        trigger={
                          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                            <span>Kunde: {getCustomerName(project.customerId)}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                        isOpen={isCustomerDropdownOpen}
                        onOpenChange={setIsCustomerDropdownOpen}
                        placement="bottom-right"
                      >
                        <div className="py-1">
                          {customers.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => {
                                onCustomerChange?.(customer.id);
                                setIsCustomerDropdownOpen(false);
                                setIsProjectMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 block ${
                                customer.id === project.customerId ? 'font-semibold text-gray-900' : 'text-gray-700'
                              }`}
                            >
                              {customer.name}
                            </button>
                          ))}
                        </div>
                      </Dropdown>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            onDeleteProject?.();
                            setIsProjectMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Projekt löschen
                        </button>
                      </div>
                    </div>
                  </Dropdown>
                </div>
              )}
            </div>
          </div>

          {/* Involved Persons Display - Only show when teamInvited is completed */}
          {shouldShowTeamMembers && (
            <div className={`transition-opacity duration-500 ${
              teamUpdateEffect ? 'opacity-100 animate-pop' : 'opacity-100'
            }`}>
              <TeamMembers
                users={getInvolvedUsers()}
                maxVisible={3}
                size="md"
                onManageClick={onManagePersonsClick}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6">
          {tabs.map((tab) => {
            const isActive = !currentTab && tab.path === location.pathname || 
                           tab.path.includes(`tab=${currentTab}`);
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon && <tab.icon className="h-4 w-4 mr-1" />}
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;