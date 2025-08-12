import { createContext } from 'react';
import { User } from './ProjectDetailsTabTasks_Types';

interface TaskContextType {
  users: User[];
  customerName: string;
  projectName: string;
  senderUserId: string;
  editingTaskId: string | null;
  editingTaskName: string;
  editingTaskBudget: string;
  editingBudgetTaskId: string | null;
  editingDateTaskId: string | null;
  editingAssigneeTaskId: string | null;
  handleTaskStatusChange: (taskId: string, statusdone: boolean) => void;
  handleTaskNameEdit: (taskId: string, newName: string) => void;
  handleTaskBudgetEdit: (taskId: string, newBudget: string) => void;
  handleTaskDateEdit: (taskId: string, date: Date | null) => void;
  handleTaskAssigneeEdit: (taskId: string, userId: string) => void;
  setEditingTaskId: (id: string | null) => void;
  setEditingTaskName: (name: string) => void;
  setEditingTaskBudget: (budget: string) => void;
  setEditingBudgetTaskId: (id: string | null) => void;
  setEditingDateTaskId: (id: string | null) => void;
  setEditingAssigneeTaskId: (id: string | null) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const TaskContext = createContext<TaskContextType>({
  users: [],
  customerName: '',
  projectName: '',
  senderUserId: '',
  editingTaskId: null,
  editingTaskName: '',
  editingTaskBudget: '',
  editingBudgetTaskId: null,
  editingDateTaskId: null,
  editingAssigneeTaskId: null,
  handleTaskStatusChange: () => {},
  handleTaskNameEdit: () => {},
  handleTaskBudgetEdit: () => {},
  handleTaskDateEdit: () => {},
  handleTaskAssigneeEdit: () => {},
  setEditingTaskId: () => {},
  setEditingTaskName: () => {},
  setEditingTaskBudget: () => {},
  setEditingBudgetTaskId: () => {},
  setEditingDateTaskId: () => {},
  setEditingAssigneeTaskId: () => {},
  formatCurrency: () => '',
  formatDate: () => ''
});