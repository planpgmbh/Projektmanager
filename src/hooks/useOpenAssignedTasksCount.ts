import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthState } from './useAuthState';

interface Task {
  id: string;
  name: string;
  statusdone: boolean;
  assignto: string;
  startDate: string;
  dueDate: string;
  budget_total: number;
  services: any[];
  sectionId: string;
}

interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  status: string;
  involvedUserIds?: string[];
}

export function useOpenAssignedTasksCount() {
  const { user } = useAuthState();
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOpenTasksCount(0);
      setIsLoading(false);
      return;
    }

    // First, fetch all projects where user is involved
    const projectsQuery = query(collection(db, 'projects'));
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];

      // Filter projects where user is involved and status is active
      const userProjects = projects.filter(project => 
        project.involvedUserIds?.includes(user.uid) && project.status === 'active'
      );

      if (userProjects.length === 0) {
        setOpenTasksCount(0);
        setIsLoading(false);
        return;
      }

      // Now fetch tasks from all user projects
      const unsubscribers: (() => void)[] = [];
      let allTasks: Task[] = [];

      userProjects.forEach(project => {
        const tasksQuery = query(
          collection(db, `projects/${project.id}/tasks`),
          where('assignto', '==', user.uid)
        );
        
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            projectId: project.id,
            ...doc.data()
          })) as Task[];
          
          // Update tasks for this project
          allTasks = allTasks.filter(task => task.projectId !== project.id);
          allTasks = [...allTasks, ...tasksData];
          
          // Count open tasks (statusdone = false)
          const openTasks = allTasks.filter(task => !task.statusdone);
          setOpenTasksCount(openTasks.length);
          setIsLoading(false);
        });

        unsubscribers.push(unsubscribe);
      });

      // Cleanup function for task subscriptions
      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    });

    return () => {
      unsubscribeProjects();
    };
  }, [user]);

  return { openTasksCount, isLoading };
}