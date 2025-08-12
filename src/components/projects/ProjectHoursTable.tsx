import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface ProjectHoursTableProps {
  timeEntries: ProcessedTimeEntry[];
  allUsers: User[];
  formatHours: (hours: number) => string;
  formatCurrency: (amount: number) => string;
}

type HoursTabType = 'tasks' | 'team';

function ProjectHoursTable({ timeEntries, allUsers, formatHours, formatCurrency }: ProjectHoursTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeHoursTab, setActiveHoursTab] = useState<HoursTabType>('tasks');

  // Group time entries by price item (for Tasks tab)
  const groupedByTasks = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.priceItemId]) {
      acc[entry.priceItemId] = {
        priceItemName: entry.priceItemName,
        hours: 0,
        value: 0,
        hourlyRate: entry.hourlyRate,
        userHours: {},
        userValues: {}
      };
    }
    acc[entry.priceItemId].hours += entry.hours;
    acc[entry.priceItemId].value += entry.hours * entry.hourlyRate;
    
    // Group by user within each task
    if (!acc[entry.priceItemId].userHours[entry.userId]) {
      acc[entry.priceItemId].userHours[entry.userId] = 0;
      acc[entry.priceItemId].userValues[entry.userId] = 0;
    }
    acc[entry.priceItemId].userHours[entry.userId] += entry.hours;
    acc[entry.priceItemId].userValues[entry.userId] += entry.hours * entry.hourlyRate;
    
    return acc;
  }, {} as Record<string, { 
    priceItemName: string; 
    hours: number; 
    value: number; 
    hourlyRate: number; 
    userHours: Record<string, number>;
    userValues: Record<string, number>;
  }>);

  // Group time entries by user (for Team tab)
  const groupedByUsers = timeEntries.reduce((acc, entry) => {
    if (!acc[entry.userId]) {
      acc[entry.userId] = {
        hours: 0,
        value: 0,
        taskHours: {},
        taskValues: {}
      };
    }
    acc[entry.userId].hours += entry.hours;
    acc[entry.userId].value += entry.hours * entry.hourlyRate;
    
    // Group by task within each user
    if (!acc[entry.userId].taskHours[entry.priceItemId]) {
      acc[entry.userId].taskHours[entry.priceItemId] = {
        hours: 0,
        priceItemName: entry.priceItemName
      };
      acc[entry.userId].taskValues[entry.priceItemId] = 0;
    }
    acc[entry.userId].taskHours[entry.priceItemId].hours += entry.hours;
    acc[entry.userId].taskValues[entry.priceItemId] += entry.hours * entry.hourlyRate;
    
    return acc;
  }, {} as Record<string, { 
    hours: number; 
    value: number; 
    taskHours: Record<string, { hours: number; priceItemName: string }>;
    taskValues: Record<string, number>;
  }>);

  const groupedTasksArray = Object.entries(groupedByTasks).map(([priceItemId, group]) => ({
    priceItemId,
    ...group
  }));

  const groupedUsersArray = Object.entries(groupedByUsers).map(([userId, group]) => ({
    userId,
    ...group
  }));

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalValue = groupedTasksArray.reduce((sum, group) => sum + group.value, 0);

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getUserName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user && user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.email || 'Unbekannter Benutzer';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Table Header with Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex justify-between items-center p-6 pb-0">
          <h3 className="text-lg font-medium text-gray-900">Eingebuchte Stunden</h3>
        </div>
        
        {/* Tabs */}
        <div className="flex px-6">
          <button
            className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeHoursTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveHoursTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
              activeHoursTab === 'team'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveHoursTab('team')}
          >
            Team
          </button>
        </div>
      </div>

      {/* Table Header Row */}
      <div className="grid grid-cols-[1fr_120px_120px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {activeHoursTab === 'tasks' ? 'Tätigkeit' : 'Person'}
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Zeit</div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Kosten</div>
      </div>

      {/* Table Content */}
      <div className="divide-y divide-gray-200">
        {activeHoursTab === 'tasks' ? (
          // Tasks Tab Content
          groupedTasksArray.length > 0 ? (
            <>
              {groupedTasksArray.map((group) => (
                <div key={group.priceItemId}>
                  {/* Task Row */}
                  <div 
                    className="grid grid-cols-[1fr_120px_120px] gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => toggleCategoryExpansion(group.priceItemId)}
                  >
                    <div className="flex items-center">
                      <ChevronRight 
                        className={`h-4 w-4 text-gray-400 mr-2 transition-transform duration-200 ${
                          expandedCategories.has(group.priceItemId) ? 'transform rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900">{group.priceItemName}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 text-right pr-0">
                      {formatHours(group.hours)}
                    </div>
                    <div className="text-sm font-medium text-gray-900 text-right pr-0">
                      {formatCurrency(group.value)}
                    </div>
                  </div>

                  {/* Expanded Content - Users for this task */}
                  {expandedCategories.has(group.priceItemId) && (
                    <div className="bg-gray-50">
                      {Object.entries(group.userHours).map(([userId, hours]) => (
                        <div key={userId} className="grid grid-cols-[1fr_120px_120px] gap-4 px-12 py-3 text-sm border-t border-gray-200">
                          <span className="text-gray-700">{getUserName(userId)}</span>
                          <span className="text-gray-600 text-right pr-0">{formatHours(hours)}</span>
                          <span className="text-gray-600 text-right pr-0">{formatCurrency(group.userValues[userId])}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Total Row */}
              <div className="grid grid-cols-[1fr_120px_120px] gap-4 px-6 py-4 bg-gray-50 font-medium border-t-2 border-gray-200">
                <span className="text-sm text-gray-900">Total</span>
                <span className="text-sm text-gray-900 text-right pr-0">{formatHours(totalHours)}</span>
                <span className="text-sm text-gray-900 text-right pr-0">{formatCurrency(totalValue)}</span>
              </div>
            </>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              Keine Zeiteinträge vorhanden
            </div>
          )
        ) : (
          // Team Tab Content
          groupedUsersArray.length > 0 ? (
            <>
              {groupedUsersArray.map((group) => (
                <div key={group.userId}>
                  {/* User Row */}
                  <div 
                    className="grid grid-cols-[1fr_120px_120px] gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => toggleCategoryExpansion(group.userId)}
                  >
                    <div className="flex items-center">
                      <ChevronRight 
                        className={`h-4 w-4 text-gray-400 mr-2 transition-transform duration-200 ${
                          expandedCategories.has(group.userId) ? 'transform rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900">{getUserName(group.userId)}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 text-right pr-0">
                      {formatHours(group.hours)}
                    </div>
                    <div className="text-sm font-medium text-gray-900 text-right pr-0">
                      {formatCurrency(group.value)}
                    </div>
                  </div>

                  {/* Expanded Content - Tasks for this user */}
                  {expandedCategories.has(group.userId) && (
                    <div className="bg-gray-50">
                      {Object.entries(group.taskHours).map(([priceItemId, taskData]) => (
                        <div key={priceItemId} className="grid grid-cols-[1fr_120px_120px] gap-4 px-12 py-3 text-sm border-t border-gray-200">
                          <span className="text-gray-700">{taskData.priceItemName}</span>
                          <span className="text-gray-600 text-right pr-0">{formatHours(taskData.hours)}</span>
                          <span className="text-gray-600 text-right pr-0">{formatCurrency(group.taskValues[priceItemId])}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {/* Total Row */}
              <div className="grid grid-cols-[1fr_120px_120px] gap-4 px-6 py-4 bg-gray-50 font-medium border-t-2 border-gray-200">
                <span className="text-sm text-gray-900">Total</span>
                <span className="text-sm text-gray-900 text-right pr-0">{formatHours(totalHours)}</span>
                <span className="text-sm text-gray-900 text-right pr-0">{formatCurrency(totalValue)}</span>
              </div>
            </>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              Keine Zeiteinträge vorhanden
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ProjectHoursTable;