import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification } from '../types/notifications';

export const createTaskAssignmentNotification = async (
  userId: string,
  senderUserId: string, // Changed from senderName to senderUserId
  customerName: string,
  projectName: string,
  taskName: string,
  projectId: string,
  taskId: string,
  senderAvatar?: string
) => {
  try {
    // Fetch sender's user document from Firebase to get firstName
    const senderDoc = await getDoc(doc(db, 'users', senderUserId));
    const senderData = senderDoc.exists() ? senderDoc.data() : null;
    
    // Use firstName from Firebase, fallback to email if not available
    const firstName = senderData?.firstName || senderData?.email?.split('@')[0] || 'Jemand';
    const senderName = senderData?.email || 'Unbekannt';
    
    const notificationData: any = {
      type: 'task_assigned',
      userId,
      senderName,
      message: `${firstName} hat dir eine Aufgabe zugewiesen`,
      subline1: `${customerName} > ${projectName}`,
      subline2: taskName,
      isRead: false,
      createdAt: new Date(),
      targetUrl: `/projects/${projectId}?tab=tasks`,
      targetId: taskId
    };

    // Only add senderAvatar if it's provided and not undefined
    if (senderAvatar) {
      notificationData.senderAvatar = senderAvatar;
    }

    await addDoc(collection(db, 'notifications'), notificationData);
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
  }
};

export const createProjectAssignmentNotification = async (
  userId: string,
  senderUserId: string, // Changed from senderName to senderUserId
  customerName: string,
  projectName: string,
  projectId: string,
  senderAvatar?: string
) => {
  try {
    // Fetch sender's user document from Firebase to get firstName
    const senderDoc = await getDoc(doc(db, 'users', senderUserId));
    const senderData = senderDoc.exists() ? senderDoc.data() : null;
    
    // Use firstName from Firebase, fallback to email if not available
    const firstName = senderData?.firstName || senderData?.email?.split('@')[0] || 'Jemand';
    const senderName = senderData?.email || 'Unbekannt';
    
    const notificationData: any = {
      type: 'project_added',
      userId,
      senderName,
      message: `${firstName} hat dich zu einem Projekt hinzugefügt`,
      subline1: `${customerName} > ${projectName}`,
      subline2: '',
      isRead: false,
      createdAt: new Date(),
      targetUrl: `/projects/${projectId}`,
      targetId: projectId
    };

    // Only add senderAvatar if it's provided and not undefined
    if (senderAvatar) {
      notificationData.senderAvatar = senderAvatar;
    }

    await addDoc(collection(db, 'notifications'), notificationData);
  } catch (error) {
    console.error('Error creating project assignment notification:', error);
  }
};

export const createProjectRemovalNotification = async (
  userId: string,
  senderUserId: string, // Changed from senderName to senderUserId
  customerName: string,
  projectName: string,
  projectId: string,
  senderAvatar?: string
) => {
  try {
    // Fetch sender's user document from Firebase to get firstName
    const senderDoc = await getDoc(doc(db, 'users', senderUserId));
    const senderData = senderDoc.exists() ? senderDoc.data() : null;
    
    // Use firstName from Firebase, fallback to email if not available
    const firstName = senderData?.firstName || senderData?.email?.split('@')[0] || 'Jemand';
    const senderName = senderData?.email || 'Unbekannt';
    
    const notificationData: any = {
      type: 'project_removed',
      userId,
      senderName,
      message: `${firstName} hat dich von einem Projekt entfernt`,
      subline1: `${customerName} > ${projectName}`,
      subline2: '',
      isRead: false,
      createdAt: new Date(),
      targetUrl: '/projects',
      targetId: projectId
    };

    // Only add senderAvatar if it's provided and not undefined
    if (senderAvatar) {
      notificationData.senderAvatar = senderAvatar;
    }

    await addDoc(collection(db, 'notifications'), notificationData);
  } catch (error) {
    console.error('Error creating project removal notification:', error);
  }
};