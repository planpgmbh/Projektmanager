import React from 'react';
import { FolderKanban, LayoutDashboard } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import ProjectsTabOverview from '../components/projects/ProjectsTabOverview';

function Projects() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');

  const tabs = [
    {
      label: 'Übersicht',
      path: '/projects',
      icon: LayoutDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Projekte"
          icon={FolderKanban}
          tabs={tabs}
        />
        
        <div className="p-8">
          <ProjectsTabOverview />
        </div>
      </div>
    </div>
  );
}

export default Projects;
