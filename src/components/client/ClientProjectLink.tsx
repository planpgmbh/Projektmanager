import React from 'react';

interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  status: string;
}

interface ClientProjectLinkProps {
  project: Project;
  onProjectClick: (project: Project) => void;
}

const ClientProjectLink: React.FC<ClientProjectLinkProps> = ({ project, onProjectClick }) => {
  return (
    <button 
      onClick={() => onProjectClick(project)} 
      className="text-gray-700 hover:text-gray-900 text-left"
    >
      {project.name}
    </button>
  );
};

export default ClientProjectLink;