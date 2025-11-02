import { Outlet, Link } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="w-64 flex-shrink-0">
        <AdminSidebar />
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center justify-between px-6">
          <div className="text-sm text-muted-foreground">Admin Dashboard</div>
          <Link to="/" target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Site
            </Button>
          </Link>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
