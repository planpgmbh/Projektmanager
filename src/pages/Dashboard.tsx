import React from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { LayoutDashboard } from 'lucide-react';

function Dashboard() {
  return (
    <div className="min-h-screen bg-[#e1dede] flex flex-col md:flex-row">
      <Sidebar />

      <div className="flex-1 w-full">
        <PageHeader 
          pageName="Dashboard"
          icon={LayoutDashboard}
        />

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <p className="text-gray-500 text-center px-4">Hier werden bald deine Projekte angezeigt!</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;