import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthState } from './useAuthState';

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  status: string;
  involvedUserIds?: string[];
}

export interface Task {
  id: string;
  name: string;
  sectionId: string;
}

export interface PriceItem {
  id: string;
  name: string;
  hourlyRate: number;
  dailyRate: number;
  ordernum: number;
}

export function useProjectsData() {
  const { user } = useAuthState();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<{ [projectId: string]: Task[] }>({});
  const [customerPricelists, setCustomerPricelists] = useState<{ [customerId: string]: PriceItem[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user's active projects
  const userActiveProjects = projects.filter(project => {
    if (!user || !project.involvedUserIds || !Array.isArray(project.involvedUserIds)) {
      return false;
    }
    const isInvolved = project.involvedUserIds.includes(user.uid);
    const isActive = project.status === 'active';
    return isInvolved && isActive;
  });

  useEffect(() => {
    const projectsQuery = query(collection(db, 'projects'), orderBy('name'));
    
    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          customerId: data.customerId,
          customerName: data.customerName,
          status: data.status || 'active',
          involvedUserIds: data.involvedUserIds || []
        };
      }) as Project[];
      
      setProjects(projectsData);

      // Fetch customer-specific pricelists for each project
      projectsData.forEach(project => {
        if (project.customerId) {
          const customerPricelistQuery = query(
            collection(db, `clients/${project.customerId}/pricelist`),
            orderBy('ordernum')
          );
          
          onSnapshot(customerPricelistQuery, (snapshot) => {
            const customerPricelistData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as PriceItem[];
            
            setCustomerPricelists(prev => ({
              ...prev,
              [project.customerId]: customerPricelistData
            }));
          }, () => {
            console.log(`No customer-specific pricelist found for customer ${project.customerId}`);
          });
        }
      });

      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching projects:', error);
      setError('Fehler beim Laden der Projekte');
      setIsLoading(false);
    });

    return () => unsubscribeProjects();
  }, []);

  // Fetch tasks for all projects
  useEffect(() => {
    if (projects.length === 0) return;

    const unsubscribers: (() => void)[] = [];

    projects.forEach(project => {
      const tasksQuery = query(
        collection(db, `projects/${project.id}/tasks`),
        orderBy('ordernum')
      );
      
      const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Task[];
        
        setAllTasks(prev => ({
          ...prev,
          [project.id]: tasksData
        }));
      });

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [projects]);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unbekanntes Projekt';
  };

  const getCustomerName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.customerName : 'Unbekannter Kunde';
  };

  const getTaskName = (taskId: string, projectId: string) => {
    const tasks = allTasks[projectId] || [];
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : 'Unbekannte Aufgabe';
  };

  const getAvailablePriceItems = (projectId: string, basicPriceItems: PriceItem[]) => {
    const project = projects.find(p => p.id === projectId);
    return project && customerPricelists[project.customerId] 
      ? customerPricelists[project.customerId] 
      : basicPriceItems;
  };

  const getPriceItemName = (priceItemId: string, projectId: string, basicPriceItems: PriceItem[]) => {
    const availablePriceItems = getAvailablePriceItems(projectId, basicPriceItems);
    const priceItem = availablePriceItems.find(p => p.id === priceItemId);
    return priceItem ? priceItem.name : 'Unbekannte Leistung';
  };

  return {
    projects,
    userActiveProjects,
    allTasks,
    customerPricelists,
    isLoading,
    error,
    getProjectName,
    getCustomerName,
    getTaskName,
    getAvailablePriceItems,
    getPriceItemName
  };
}