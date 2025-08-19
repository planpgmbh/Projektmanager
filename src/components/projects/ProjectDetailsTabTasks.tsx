import React, { useState, useEffect, useCallback, memo } from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useParams } from 'react-router-dom';
import { useAuthState } from '../../hooks/useAuthState';
import { createTaskAssignmentNotification, createTaskCompletedNotification } from '../../utils/notifications';
import { Task, Section, User, ProcessedTimeEntry, PriceItem } from './ProjectDetailsTabTasks_Types';
import { TaskContext } from './ProjectDetailsTabTasks_Context';
import ProjectDetailsTabTasks_Section from './ProjectDetailsTabTasks_Section';

interface ProjectDetailsTabTasksProps {
  customerId?: string;
  customerName: string;
  projectName: string;
  projectId: string;
  project: Project;
  timeEntries: ProcessedTimeEntry[];
  basicPriceItems: PriceItem[];
  customerPricelists: { [customerId: string]: PriceItem[] };
}

const ProjectDetailsTabTasks = memo(function ProjectDetailsTabTasks({ 
  customerId, 
  customerName,
  projectName,
  projectId,
  project,
  timeEntries, 
  basicPriceItems, 
  customerPricelists 
}: ProjectDetailsTabTasksProps) {
  const { user } = useAuthState();
  const [sections, setSections] = useState<Section[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState('');
  const [editingTaskBudget, setEditingTaskBudget] = useState<string>('');
  const [editingBudgetTaskId, setEditingBudgetTaskId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingAssigneeTaskId, setEditingAssigneeTaskId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    let unsubscribeSections: (() => void) | undefined;
    let unsubscribeTasks: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const sectionsRef = collection(db, `projects/${projectId}/sections`);
        const sectionsQuery = query(sectionsRef, orderBy('ordernum'));

        unsubscribeSections = onSnapshot(sectionsQuery, (snapshot) => {
          const sectionsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Section[];
          setSections(sectionsData);
        });

        const tasksRef = collection(db, `projects/${projectId}/tasks`);
        const tasksQuery = query(tasksRef, orderBy('ordernum'));

        unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Task[];
          setTasks(tasksData);
        });

        const usersRef = collection(db, 'users');
        unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
          const usersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as User[];
          setUsers(usersData);
        });

        setDataLoaded(true);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Fehler beim Laden der Daten');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribeSections) unsubscribeSections();
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeUsers) unsubscribeUsers();
      setDataLoaded(false);
    };
  }, [projectId]);

  const handleAddSection = async () => {
    if (!projectId) return;

    try {
      const sectionsRef = collection(db, `projects/${projectId}/sections`);
      const maxOrdernum = sections.reduce((max, section) => 
        Math.max(max, section.ordernum || 0), 0);

      const newSection = {
        name: 'Neuer Abschnitt',
        ordernum: maxOrdernum + 1000
      };

      await addDoc(sectionsRef, newSection);
    } catch (err) {
      console.error('Error adding section:', err);
      setError('Fehler beim Hinzufügen des Abschnitts');
    }
  };

  const handleDuplicateSection = async (section: Section) => {
    if (!projectId) return;

    try {
      const sectionsRef = collection(db, `projects/${projectId}/sections`);
      const maxOrdernum = sections.reduce((max, section) => 
        Math.max(max, section.ordernum || 0), 0);

      const newSection = {
        name: `${section.name} (Kopie)`,
        ordernum: maxOrdernum + 1000
      };

      const newSectionDoc = await addDoc(sectionsRef, newSection);

      // Duplicate all tasks in this section
      const sectionTasks = tasks.filter(task => task.sectionId === section.id);
      const tasksRef = collection(db, `projects/${projectId}/tasks`);

      for (const task of sectionTasks) {
        const newTask = {
          ...task,
          name: `${task.name} (Kopie)`,
          sectionId: newSectionDoc.id
        };
        delete newTask.id;
        await addDoc(tasksRef, newTask);
      }

      setOpenMenuId(null);
    } catch (err) {
      console.error('Error duplicating section:', err);
      setError('Fehler beim Duplizieren des Abschnitts');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!projectId) return;

    try {
      // Delete all tasks in this section first
      const sectionTasks = tasks.filter(task => task.sectionId === sectionId);
      for (const task of sectionTasks) {
        await deleteDoc(doc(db, `projects/${projectId}/tasks`, task.id));
      }

      // Then delete the section
      const sectionRef = doc(db, `projects/${projectId}/sections`, sectionId);
      await deleteDoc(sectionRef);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error deleting section:', err);
      setError('Fehler beim Löschen des Abschnitts');
    }
  };

  const handleAddTask = async (sectionId: string) => {
    if (!projectId) return;

    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const sectionTasks = tasks.filter(task => task.sectionId === sectionId);
      const maxOrdernum = sectionTasks.reduce((max, task) => 
        Math.max(max, task.ordernum || 0), 0);

      const newTask = {
        name: 'Neue Aufgabe',
        statusdone: false,
        ordernum: maxOrdernum + 1000,
        assignto: '',
        startDate: '',
        dueDate: '',
        effort_total: 0,
        budget_total: 0,
        services: [],
        sectionId
      };

      await addDoc(tasksRef, newTask);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Fehler beim Hinzufügen der Aufgabe');
    }
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!projectId) return;

    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const sectionTasks = tasks.filter(t => t.sectionId === task.sectionId);
      const maxOrdernum = sectionTasks.reduce((max, t) => 
        Math.max(max, t.ordernum || 0), 0);

      const newTask = {
        ...task,
        name: `${task.name} (Kopie)`,
        ordernum: maxOrdernum + 1000
      };
      delete newTask.id;

      await addDoc(tasksRef, newTask);
    } catch (err) {
      console.error('Error duplicating task:', err);
      setError('Fehler beim Duplizieren der Aufgabe');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;

    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await deleteDoc(taskRef);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Fehler beim Löschen der Aufgabe');
    }
  };

  const handleSectionNameEdit = async (sectionId: string, newName: string) => {
    if (!projectId) return;

    try {
      const sectionRef = doc(db, `projects/${projectId}/sections`, sectionId);
      await updateDoc(sectionRef, { name: newName });
      setEditingSectionId(null);
    } catch (err) {
      console.error('Error updating section name:', err);
      setError('Fehler beim Aktualisieren des Abschnittsnamens');
    }
  };

  const handleTaskNameEdit = async (taskId: string, newName: string) => {
    if (!projectId) return;

    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, { name: newName });
      setEditingTaskId(null);
    } catch (err) {
      console.error('Error updating task name:', err);
      setError('Fehler beim Aktualisieren des Aufgabennamens');
    }
  };

  const handleTaskBudgetEdit = async (taskId: string, newBudget: string) => {
    if (!projectId) return;

    try {
      const budget = parseFloat(newBudget);
      if (isNaN(budget)) return;

      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, { budget_total: budget });
      setEditingBudgetTaskId(null);
    } catch (err) {
      console.error('Error updating task budget:', err);
      setError('Fehler beim Aktualisieren des Budgets');
    }
  };

  const handleTaskDatesEdit = async (taskId: string, startDate: Date | null, dueDate: Date | null) => {
    if (!projectId) return;

    try {
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, { 
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : ''
      });
    } catch (err) {
      console.error('Error updating task dates:', err);
      setError('Fehler beim Aktualisieren der Termine');
    }
  };

  const handleTaskAssigneeEdit = async (taskId: string, userId: string) => {
    if (!projectId) return;

    try {
      // Get the current task to check if assignee is changing
      const currentTask = tasks.find(task => task.id === taskId);
      const previousAssignee = currentTask?.assignto;
      
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, { assignto: userId });
      
      // Send notification if a new user is assigned (not when removing assignment)
      if (userId && userId !== previousAssignee && user) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          await createTaskAssignmentNotification(
            userId,
            user.uid,
            customerName,
            projectName,
            task.name,
            projectId,
            taskId
          );
        }
      }
      
      setEditingAssigneeTaskId(null);
    } catch (err) {
      console.error('Error updating task assignee:', err);
      setError('Fehler beim Aktualisieren der Verantwortung');
    }
  };

  const handleTaskStatusChange = async (taskId: string, statusdone: boolean) => {
    console.log('🔄 DEBUG: handleTaskStatusChange called with:', { taskId, statusdone });
    if (!projectId) return;

    try {
      // Get the current task to check if status is actually changing
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) {
        console.log('❌ DEBUG: Current task not found for taskId:', taskId);
        return;
      }
      
      console.log('📋 DEBUG: Current task status:', currentTask.statusdone);
      console.log('📋 DEBUG: New status:', statusdone);
      
      const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
      await updateDoc(taskRef, { statusdone });
      
      // Send notification to project managers only when task status changes from false to true
      if (statusdone && !currentTask.statusdone && user && project?.PMUserIDs) {
        console.log('🎯 DEBUG: Conditions met for sending notification');
        console.log('  - statusdone:', statusdone);
        console.log('  - !currentTask.statusdone:', !currentTask.statusdone);
        console.log('  - user exists:', !!user);
        console.log('  - project.PMUserIDs:', project.PMUserIDs);
        
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          // ÄNDERUNG: Alle Projektmanager benachrichtigen, auch den Sender
          const projectManagersToNotify = project.PMUserIDs;
          console.log('👥 DEBUG: Project managers to notify (including sender):', projectManagersToNotify);
          
          // Send notification to each project manager
          for (const pmUserId of projectManagersToNotify) {
            console.log('📤 DEBUG: Sending notification to PM:', pmUserId);
            await createTaskCompletedNotification(
              pmUserId,
              user.uid,
              customerName,
              projectName,
              task.name,
              projectId,
              taskId
            );
          }
        } else {
          console.log('❌ DEBUG: Task not found in tasks array for notification');
        }
      } else {
        console.log('⏭️ DEBUG: Notification conditions not met:');
        console.log('  - statusdone:', statusdone);
        console.log('  - !currentTask.statusdone:', !currentTask.statusdone);
        console.log('  - user exists:', !!user);
        console.log('  - project exists:', !!project);
        console.log('  - project.PMUserIDs exists:', !!project?.PMUserIDs);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Fehler beim Aktualisieren des Aufgabenstatus');
    }
  };

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, type, draggableId } = result;

    if (!destination || !projectId) {
      return;
    }

    try {
      if (type === 'section') {
        const draggedSection = sections.find(s => s.id === draggableId);
        if (!draggedSection) return;

        const newSections = Array.from(sections);
        newSections.splice(source.index, 1);
        newSections.splice(destination.index, 0, draggedSection);

        const updates = newSections.map((section, index) => {
          const ordernum = (index + 1) * 1000;
          return updateDoc(
            doc(db, `projects/${projectId}/sections`, section.id),
            { ordernum }
          );
        });

        await Promise.all(updates);
      } else {
        const draggedTask = tasks.find(t => t.id === draggableId);
        if (!draggedTask) return;

        const sourceTasks = tasks
          .filter(task => task.sectionId === source.droppableId)
          .sort((a, b) => a.ordernum - b.ordernum);
        
        const destTasks = tasks
          .filter(task => task.sectionId === destination.droppableId)
          .sort((a, b) => a.ordernum - b.ordernum);

        sourceTasks.splice(source.index, 1);

        if (source.droppableId === destination.droppableId) {
          sourceTasks.splice(destination.index, 0, draggedTask);
        } else {
          destTasks.splice(destination.index, 0, draggedTask);
        }

        const updates = [];

        sourceTasks.forEach((task, index) => {
          updates.push(updateDoc(
            doc(db, `projects/${projectId}/tasks`, task.id),
            { ordernum: (index + 1) * 1000 }
          ));
        });

        if (source.droppableId !== destination.droppableId) {
          destTasks.forEach((task, index) => {
            updates.push(updateDoc(
              doc(db, `projects/${projectId}/tasks`, task.id),
              {
                sectionId: destination.droppableId,
                ordernum: (index + 1) * 1000
              }
            ));
          });
        }

        await Promise.all(updates);
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError('Fehler beim Aktualisieren der Reihenfolge');
    }
  }, [projectId, sections, tasks]);

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE').format(date);
  };

  if (isLoading || !dataLoaded) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <TaskContext.Provider value={{
      users,
      customerName,
      projectName,
      senderUserId: user?.uid || '',
      editingTaskId,
      editingTaskName,
      editingTaskBudget,
      editingBudgetTaskId,
      editingAssigneeTaskId,
      handleTaskStatusChange,
      handleTaskNameEdit,
      handleTaskBudgetEdit,
      handleTaskDatesEdit,
      handleTaskAssigneeEdit,
      setEditingTaskId,
      setEditingTaskName,
      setEditingTaskBudget,
      setEditingBudgetTaskId,
      setEditingAssigneeTaskId,
      formatCurrency,
      formatDate
    }}>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="bg-white">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-[30px_1fr_150px_150px_150px_150px_30px] gap-4 px-6 py-3 bg-gray-100 border-y border-gray-200">
            <div></div>
            <div className="text-xs font-medium text-gray-500 uppercase">Name</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Verantwortung</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Termine</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Aufwand</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Budget</div>
            <div></div>
          </div>

          {sections.length > 0 ? (
            <Droppable droppableId="sections" type="section">
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="min-h-[50px]"
                >
                  {sections.map((section, index) => (
                    <ProjectDetailsTabTasks_Section
                      key={section.id}
                      section={section}
                      tasks={tasks}
                      processedTimeEntries={timeEntries}
                      index={index}
                      editingSectionId={editingSectionId}
                      editingSectionName={editingSectionName}
                      openMenuId={openMenuId}
                      onSectionNameEdit={handleSectionNameEdit}
                      onDuplicateSection={handleDuplicateSection}
                      onDeleteSection={handleDeleteSection}
                      onAddTask={handleAddTask}
                      onDuplicateTask={handleDuplicateTask}
                      onDeleteTask={handleDeleteTask}
                      setEditingSectionId={setEditingSectionId}
                      setEditingSectionName={setEditingSectionName}
                      setOpenMenuId={setOpenMenuId}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Keine Abschnitte vorhanden
            </div>
          )}

          <div 
            className="grid grid-cols-[5px_1fr] px-6 py-3 mt-[30px] cursor-pointer"
            onClick={handleAddSection}
          >
            <div></div>
            <div className="flex items-center">
              <Plus className="h-4 w-4 text-gray-400 mr-2" />
              <span className="font-medium text-gray-900">Abschnitt hinzufügen</span>
            </div>
          </div>
        </div>
      </DragDropContext>
    </TaskContext.Provider>
  );
});

export default ProjectDetailsTabTasks;