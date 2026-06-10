import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useState } from 'react';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

