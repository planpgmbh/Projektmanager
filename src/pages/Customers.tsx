import React from 'react';
import { Building2, LayoutDashboard } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import CustomersTabOverview from '../components/customers/CustomersTabOverview';

function Customers() {
  const tabs = [
    {
      label: 'Übersicht',
      path: '/customers',
      icon: LayoutDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Kunden"
          icon={Building2}
          tabs={tabs}
        />
        
        <div className="p-8">
          <CustomersTabOverview />
        </div>
      </div>
    </div>
  );
}

export default Customers;