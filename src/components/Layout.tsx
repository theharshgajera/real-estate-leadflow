import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Users,
  BarChart3,
  Calendar,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/leads', label: 'Leads', icon: FileText },
    { path: '/admin/users', label: 'Users', icon: Users },
  ];

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/leads', label: 'My Leads', icon: FileText },
    { path: '/tasks', label: "Today's Tasks", icon: Calendar },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground">Real Estate CRM</h1>
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop Right Section */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                {userRole}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Smooth Animated Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            menuOpen ? 'max-h-[500px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'
          } px-4`}
        >
          <div className="space-y-2 pb-4 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
                <div className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded inline-block mt-1">
                  {userRole}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
