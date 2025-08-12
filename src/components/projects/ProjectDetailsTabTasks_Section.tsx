import React from 'react';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { Section, Task, ProcessedTimeEntry } from './ProjectDetailsTabTasks_Types';
import ProjectDetailsTabTasks_Task from './ProjectDetailsTabTasks_Task';
import { TableRow } from '../ui/TableRow';

interface ProjectDetailsTabTasks_SectionProps {
  section: Section;
  tasks: Task[];
  processedTimeEntries: ProcessedTimeEntry[];
  index: number;
  editingSectionId: string | null;
  editingSectionName: string;
  openMenuId: string | null;
  onSectionNameEdit: (sectionId: string, newName: string) => void;
  onDuplicateSection: (section: Section) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddTask: (sectionId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  setEditingSectionId: (id: string | null) => void;
  setEditingSectionName: (name: string) => void;
  setOpenMenuId: (id: string | null) => void;
}

const ProjectDetailsTabTasks_Section: React.FC<ProjectDetailsTabTasks_SectionProps> = ({
  section,
  tasks,
  processedTimeEntries,
  index,
  onSectionNameEdit,
  onDuplicateSection,
  onDeleteSection,
  onAddTask,
  onDuplicateTask,
  onDeleteTask
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true); // Sections are open by default

  const sectionTasks = tasks
    .filter(task => task.sectionId === section.id)
    .sort((a, b) => a.ordernum - b.ordernum);

  return (
    <Draggable
      key={section.id}
      draggableId={section.id}
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="mb-4 group"
        >
          <TableRow
            id={section.id}
            name={section.name}
            onNameEdit={(newName) => onSectionNameEdit(section.id, newName)}
            onDuplicate={() => onDuplicateSection(section)}
            onDelete={() => onDeleteSection(section.id)}
            dragHandleProps={provided.dragHandleProps}
            isExpanded={isExpanded}
            onExpandToggle={() => setIsExpanded(!isExpanded)}
          />

          {isExpanded && (
            <Droppable droppableId={section.id} type="task">
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className="min-h-[50px]"
                >
                  {sectionTasks.map((task, index) => (
                    <ProjectDetailsTabTasks_Task
                      key={task.id}
                      task={task}
                      processedTimeEntries={processedTimeEntries}
                      index={index}
                      onDuplicateTask={onDuplicateTask}
                      onDeleteTask={onDeleteTask}
                    />
                  ))}
                  {provided.placeholder}
                  
                  <div className="pl-[73px] py-2 hover:bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={() => onAddTask(section.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Aufgabe hinzufügen...
                    </button>
                  </div>
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default ProjectDetailsTabTasks_Section;