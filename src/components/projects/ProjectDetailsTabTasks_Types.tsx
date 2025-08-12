export interface Task {
  id: string;
  name: string;
  statusdone: boolean;
  ordernum: number;
  assignto: string;
  startDate: string;
  dueDate: string;
  effort_total: number;
  budget_total: number;
  services: Service[];
  sectionId: string;
}

export interface Service {
  id: string;
  name: string;
  total_hours: number;
  total_eur: number;
  arbeiter: Worker[];
}

export interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Section {
  id: string;
  ordernum: number;
  name: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface WorkflowStep {
  status: 'pending' | 'current' | 'completed' | 'disabled' | 'skipped';
  offerId?: string;
  offerNumber?: string;
  offerStatus?: 'draft' | 'open' | 'approved' | 'rejected';
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: 'draft' | 'open' | 'paid' | 'overdue';
  completedAt?: Date;
}

export interface ProjectWorkflow {
  teamInvited: WorkflowStep;
  distributeTasks: WorkflowStep;
  offerCreated: WorkflowStep;
  offerApproved: WorkflowStep;
  invoiceCreated: WorkflowStep;
  invoicePaid: WorkflowStep;
  projectArchived: WorkflowStep;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  description?: string;
  status: string;
  involvedUserIds?: string[];
  totalBudget?: number;
  workflow?: ProjectWorkflow;
}

export interface TimeEntry {
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

export interface PriceItem {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
  ordernum: number;
}

export interface GroupedTimeEntry {
  priceItemId: string;
  priceItemName: string;
  totalHours: number;
  totalValue: number;
  hourlyRate: number;
  entries: TimeEntry[];
}

export interface ProcessedTimeEntry extends TimeEntry {
  priceItemName: string;
  hourlyRate: number;
}