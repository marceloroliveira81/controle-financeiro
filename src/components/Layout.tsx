import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LayoutDashboard, List, Filter } from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
        <nav className="flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 transition-colors hover:text-foreground ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`
            }
          >
            <LayoutDashboard className="h-6 w-6" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `flex items-center gap-2 transition-colors hover:text-foreground ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`
            }
          >
            <List className="h-6 w-6" />
            <span>Lançamentos</span>
          </NavLink>
        </nav>
        <Button onClick={handleSignOut} variant="outline">
          Sair
        </Button>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;