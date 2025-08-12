import React from 'react';
import { Users, LayoutDashboard } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import TeamTabOverview from '../components/team/TeamTabOverview';

function Team() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');

  const tabs = [
    {
      label: 'Übersicht',
      path: '/team',
      icon: LayoutDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Team"
          icon={Users}
          tabs={tabs}
        />
        
        <div className="p-8">
          <TeamTabOverview />
        </div>
      </div>
    </div>
  );
}

export default Team;
