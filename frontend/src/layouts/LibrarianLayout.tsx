import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LibrarianSidebar from '../components/librarian/LibrarianSidebar';
import LibrarianHeader from '../components/librarian/LibrarianHeader';

const LibrarianLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <LibrarianSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        <LibrarianHeader />

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LibrarianLayout;
