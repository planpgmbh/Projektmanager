import React, { useState, useContext } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Task, ProcessedTimeEntry } from './ProjectDetailsTabTasks_Types';
import { TaskContext } from './ProjectDetailsTabTasks_Context';

interface ProjectDetailsTabTasks_TaskProps {
  task: Task;
  processedTimeEntries: ProcessedTimeEntry[];
  index: number;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const ProjectDetailsTabTasks_Task: React.FC<ProjectDetailsTabTasks_TaskProps> = ({
  task,
  processedTimeEntries,
  index,
  onDuplicateTask,
  onDeleteTask
}) => {
  const {
    users,
    editingTaskId,
    editingTaskName,
    editingTaskBudget,
    editingBudgetTaskId,
    editingDateTaskId,
    editingAssigneeTaskId,
    handleTaskStatusChange,
    handleTaskNameEdit,
    handleTaskBudgetEdit,
    handleTaskDateEdit,
    handleTaskAssigneeEdit,
    setEditingTaskId,
    setEditingTaskName,
    setEditingTaskBudget,
    setEditingBudgetTaskId,
    setEditingDateTaskId,
    setEditingAssigneeTaskId,
    formatCurrency,
    formatDate
  } = useContext(TaskContext);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // Tasks are closed by default

  // Zeiteinträge für diese Aufgabe filtern und nach Preisposition gruppieren
  const taskTimeEntries = processedTimeEntries.filter(entry => entry.taskId === task.id);
  
  const groupedTimeEntries = taskTimeEntries.reduce((acc, entry) => {
    if (!acc[entry.priceItemId]) {
      acc[entry.priceItemId] = {
        priceItemId: entry.priceItemId,
        priceItemName: entry.priceItemName || 'Unbekannte Leistung',
        hourlyRate: entry.hourlyRate || 0,
        totalHours: 0,
        totalValue: 0,
        entries: [],
        userIds: new Set<string>() // Track unique user IDs
      };
    }
    
    acc[entry.priceItemId].totalHours += entry.hours;
    acc[entry.priceItemId].totalValue += entry.hours * (entry.hourlyRate || 0);
    acc[entry.priceItemId].entries.push(entry);
    acc[entry.priceItemId].userIds.add(entry.userId); // Add user ID to set
    
    return acc;
  }, {} as Record<string, {
    priceItemId: string;
    priceItemName: string;
    hourlyRate: number;
    totalHours: number;
    totalValue: number;
    entries: ProcessedTimeEntry[];
    userIds: Set<string>;
  }>);

  const groupedTimeEntriesArray = Object.values(groupedTimeEntries);

  // Gesamtaufwand berechnen: Services + Zeiteinträge
  const servicesTotal = task.services?.reduce((sum, service) => sum + service.total_eur, 0) || 0;
  const timeEntriesTotal = groupedTimeEntriesArray.reduce((sum, group) => sum + group.totalValue, 0);
  const totalEffort = servicesTotal + timeEntriesTotal;

  // Progress bar calculation - Nur anzeigen wenn Budget > 0
  const getProgressPercentage = () => {
    if (task.budget_total === 0) {
      return 0; // Kein Budget = keine Anzeige
    }
    return Math.min((totalEffort / task.budget_total) * 100, 100);
  };

  const isOverBudget = totalEffort > task.budget_total && task.budget_total > 0;
  const progressPercentage = getProgressPercentage();
  const hasBudget = task.budget_total > 0;

  // Helper function to create acronym from name
  const createAcronym = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  };

  // Helper function to get user names from user IDs
  const getUserAcronyms = (userIds: Set<string>) => {
    const userAcronyms = Array.from(userIds)
      .map(userId => {
        const user = users.find(u => u.id === userId);
        if (!user) return null;
        
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        const acronym = createAcronym(user.firstName || '', user.lastName || '');
        
        return {
          acronym,
          fullName: fullName || 'Unbekannt'
        };
      })
      .filter(item => item !== null && item.acronym !== '');
    
    return userAcronyms.length > 0 ? userAcronyms : [{ acronym: '?', fullName: 'Unbekannt' }];
  };

  return (
    <Draggable 
      key={task.id} 
      draggableId={task.id} 
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="group"
        >
          <div
            {...provided.dragHandleProps}
            className="grid grid-cols-[30px_1fr_150px_150px_150px_150px_30px] gap-4 px-6 py-2 bg-white hover:bg-gray-50 border-b border-gray-200"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center justify-center p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
            >
              <ChevronRight
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'transform rotate-90' : ''
                }`}
              />
            </button>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={task.statusdone}
                onChange={(e) => handleTaskStatusChange(task.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {editingTaskId === task.id ? (
                <input
                  type="text"
                  value={editingTaskName}
                  onChange={(e) => setEditingTaskName(e.target.value)}
                  onBlur={() => {
                    if (editingTaskName.trim()) {
                      handleTaskNameEdit(task.id, editingTaskName);
                    }
                    setEditingTaskId(null);
                  }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingTaskName.trim()) {
                      handleTaskNameEdit(task.id, editingTaskName);
                    } else if (e.key === 'Escape') {
                      setEditingTaskId(null);
                    }
                  }}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <span
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setEditingTaskName(task.name);
                    }}
                    className="text-sm text-gray-900 cursor-text hover:text-blue-600"
                  >
                    {task.name}
                  </span>
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                    {openMenuId === task.id && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              onDuplicateTask(task);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Aufgabe duplizieren
                          </button>
                          <button
                            onClick={() => {
                              onDeleteTask(task.id);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Aufgabe löschen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              {editingAssigneeTaskId === task.id ? (
                <select
                  value={task.assignto}
                  onChange={(e) => handleTaskAssigneeEdit(task.id, e.target.value)}
                  onBlur={() => setEditingAssigneeTaskId(null)}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  <option value="">-</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  onClick={() => setEditingAssigneeTaskId(task.id)}
                  className="cursor-pointer hover:text-blue-600"
                >
                  {task.assignto ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      {users.find(u => u.id === task.assignto)?.firstName || task.assignto}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right">
              {editingDateTaskId === task.id ? (
                <DatePicker
                  selected={task.date ? new Date(task.date) : null}
                  onChange={(date) => handleTaskDateEdit(task.id, date)}
                  onBlur={() => setEditingDateTaskId(null)}
                  dateFormat="dd.MM.yyyy"
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <div
                  onClick={() => setEditingDateTaskId(task.id)}
                  className="cursor-pointer hover:text-blue-600"
                >
                  {task.date ? (
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      {formatDate(task.date)}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-right flex justify-end items-center">
              {/* Progress Bar - Nur anzeigen wenn Budget > 0 */}
              {hasBudget ? (
                <div className="w-[80px] bg-gray-200 rounded-full h-2.5 relative">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              ) : (
                <div className="w-[80px] flex justify-center">
                  <span className="text-xs text-gray-400">-</span>
                </div>
              )}
            </div>
            <div className="text-right text-sm">
              {editingBudgetTaskId === task.id ? (
                <input
                  type="number"
                  value={editingTaskBudget}
                  onChange={(e) => setEditingTaskBudget(e.target.value)}
                  onBlur={() => {
                    handleTaskBudgetEdit(task.id, editingTaskBudget);
                  }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTaskBudgetEdit(task.id, editingTaskBudget);
                    } else if (e.key === 'Escape') {
                      setEditingBudgetTaskId(null);
                    }
                  }}
                  className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => {
                    setEditingBudgetTaskId(task.id);
                    setEditingTaskBudget(task.budget_total.toString());
                  }}
                  className="cursor-pointer hover:text-blue-600"
                >
                  {formatCurrency(task.budget_total)}
                </span>
              )}
            </div>
            <div></div>
          </div>

          {isExpanded && (
            <div className="pl-0">
              {/* Bestehende Services */}
              {task.services && task.services.length > 0 && (
                task.services.map((service) => (
                  <div
                    key={service.id}
                    className="grid grid-cols-[1fr_150px_150px_150px_150px_30px] gap-4 px-6 py-2 bg-gray-50 border-b border-gray-200"
                  >
                    <div className="text-sm text-gray-600 pl-[73px]">{service.name}</div>
                    <div className="text-right">
                      {/* Show workers for this service */}
                      {service.arbeiter && service.arbeiter.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {service.arbeiter.map((worker, index) => {
                            const acronym = createAcronym(worker.firstName, worker.lastName);
                            const fullName = `${worker.firstName} ${worker.lastName}`.trim();
                            
                            return (
                              <div 
                                key={index} 
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-gray-200 text-gray-600 cursor-default"
                                title={fullName}
                              >
                                {acronym}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div></div>
                    <div className="text-sm text-right">{formatCurrency(service.total_eur)}</div>
                    <div></div>
                    <div></div>
                  </div>
                ))
              )}

              {/* Gruppierte Zeiteinträge */}
              {groupedTimeEntriesArray.map((group) => {
                const userAcronyms = getUserAcronyms(group.userIds);
                
                return (
                  <div
                    key={group.priceItemId}
                    className="grid grid-cols-[1fr_150px_150px_150px_150px_30px] gap-4 px-6 py-2 bg-gray-100 border-b border-gray-200"
                  >
                    <div className="text-sm text-gray-900 pl-[73px]">{group.priceItemName}</div>
                    <div className="text-right">
                      {/* Show all users who worked on this price item as acronyms in circles */}
                      <div className="flex flex-wrap gap-1 justify-end">
                        {userAcronyms.map((userInfo, index) => (
                          <div 
                            key={index} 
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-gray-200 text-gray-600 cursor-default"
                            title={userInfo.fullName}
                          >
                            {userInfo.acronym}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div></div>
                    <div className="text-sm text-right text-gray-900">
                      {formatCurrency(group.totalValue)}
                    </div>
                    <div></div>
                    <div></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default ProjectDetailsTabTasks_Task;