import React from 'react';
import { Receipt, LayoutDashboard } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import InvoicesTabOverview from '../components/invoices/InvoicesTabOverview';

function Invoices() {
  const tabs = [
    {
      label: 'Übersicht',
      path: '/invoices',
      icon: LayoutDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Rechnungen"
          icon={Receipt}
          tabs={tabs}
        />
        
        <div className="p-8">
          <InvoicesTabOverview />
        </div>
      </div>
    </div>
  );
}

export default Invoices;