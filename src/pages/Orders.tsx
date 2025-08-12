import React from 'react';
import { FileText, LayoutDashboard } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import OrdersTabOverview from '../components/orders/OrdersTabOverview';

function Orders() {
  const tabs = [
    {
      label: 'Übersicht',
      path: '/orders',
      icon: LayoutDashboard
    }
  ];

  return (
    <div className="min-h-screen bg-[#e1dede] flex">
      <Sidebar />
      <div className="flex-1">
        <PageHeader 
          pageName="Angebote"
          icon={FileText}
          tabs={tabs}
        />
        
        <div className="p-8">
          <OrdersTabOverview />
        </div>
      </div>
    </div>
  );
}

export default Orders;