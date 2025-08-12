import React from 'react';
import Popup from '../ui/Popup';

interface Project {
  id: string;
  name: string;
  status: string;
  // Add other project properties as needed
}

interface EditProjectProps {
  project: Project;
  onClose: () => void;
}

function EditProject({ project, onClose }: EditProjectProps) {
  return (
    <Popup title={`Projekt bearbeiten: ${project.name}`} onClose={onClose}>
      <div className="p-4">
        {/* Project edit form will be implemented here */}
        <p className="text-gray-600">Projekt-Bearbeitung wird implementiert...</p>
      </div>
    </Popup>
  );
}

export default EditProject;