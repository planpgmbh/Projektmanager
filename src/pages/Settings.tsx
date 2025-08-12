import React from 'react';
import { Settings as SettingsIcon, LayoutDashboard, Calculator, Bell } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import SettingsTabOverview from '../components/settings/SettingsTabOverview';
import SettingsTabPricing from '../components/settings/SettingsTabPricing';
import SettingsTabNotifications from '../components/settings/SettingsTabNotifications';

function Settings() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab');
  
  const tabs = [
    {
      label: 'Übersicht',
      path: '/settings',
      icon: LayoutDashboard
    },
    {
      label: 'Benachrichtigungen',
      path: '/settings?tab=notifications',
      icon: Bell
    },
    {
      label: 'Preisliste Basis',
      path: '/settings?tab=pricing',
      icon: Calculator
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Einstellungen"
          icon={SettingsIcon}
          tabs={tabs}
        />
        
        <div className="p-8">
          {currentTab === 'notifications' ? (
            <SettingsTabNotifications />
          ) : currentTab === 'pricing' ? (
            <SettingsTabPricing />
          ) : (
            <SettingsTabOverview />
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;