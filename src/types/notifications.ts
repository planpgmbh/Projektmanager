export interface Notification {
  id: string;
  type: 'task_assigned' | 'project_added' | 'project_removed';
  senderName: string;
  senderAvatar?: string;
  message: string;
  subline1: string;
  subline2: string;
  isRead: boolean;
  createdAt: Date;
  targetUrl: string;
  targetId: string;
  userId: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskAssignments: boolean;
}