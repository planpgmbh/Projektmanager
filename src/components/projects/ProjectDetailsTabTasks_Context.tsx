import { createContext } from 'react';
import { User } from './ProjectDetailsTabTasks_Types';

interface TaskContextType {
  users: User[];
  involvedUserIds: string[];
  customerName: string;
  projectName: string;
  senderUserId: string;
  editingTaskId: string | null;
  editingTaskName: string;
  editingTaskBudget: string;
  editingBudgetTaskId: string | null;
  editingAssigneeTaskId: string | null;
  handleTaskStatusChange: (taskId: string, statusdone: boolean) => void;
  handleTaskNameEdit: (taskId: string, newName: string) => void;
  handleTaskBudgetEdit: (taskId: string, newBudget: string) => void;
  handleTaskDatesEdit: (taskId: string, startDate: Date | null, dueDate: Date | null) => void;
  handleTaskAssigneeEdit: (taskId: string, userId: string) => void;
  setEditingTaskId: (id: string | null) => void;
  setEditingTaskName: (name: string) => void;
  setEditingTaskBudget: (budget: string) => void;
  setEditingBudgetTaskId: (id: string | null) => void;
  setEditingAssigneeTaskId: (id: string | null) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const TaskContext = createContext<TaskContextType>({
  users: [],
  involvedUserIds: [],
  customerName: '',
  projectName: '',
  senderUserId: '',
  editingTaskId: null,
  editingTaskName: '',
  editingTaskBudget: '',
  editingBudgetTaskId: null,
  editingAssigneeTaskId: null,
  handleTaskStatusChange: () => {},
  handleTaskNameEdit: () => {},
  handleTaskBudgetEdit: () => {},
  handleTaskDatesEdit: () => {},
  handleTaskAssigneeEdit: () => {},
  setEditingTaskId: () => {},
  setEditingTaskName: () => {},
  setEditingTaskBudget: () => {},
  setEditingBudgetTaskId: () => {},
  setEditingAssigneeTaskId: () => {},
  formatCurrency: () => '',
  formatDate: () => ''
});