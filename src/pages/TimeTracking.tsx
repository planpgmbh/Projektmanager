import React from 'react';
import { Clock, LayoutDashboard } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import TimeTrackingOverview from '../components/timeTracking/TimeTrackingOverview';

function TimeTracking() {
  const tabs = [
    {
      label: 'Übersicht',
      path: '/zeiterfassung',
      icon: LayoutDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Zeiterfassung"
          icon={Clock}
          tabs={tabs}
        />
        
        <div className="p-8">
          <TimeTrackingOverview />
        </div>
      </div>
    </div>
  );
}

export default TimeTracking;