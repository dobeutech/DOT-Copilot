import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from './Button';
import { Text } from './Text';
import './Layout.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/driver-dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/training-builder', label: 'Training', icon: '📚', roles: ['ADMIN', 'SUPERVISOR'] },
  { path: '/supervisor', label: 'Supervisor', icon: '👥', roles: ['ADMIN', 'SUPERVISOR'] },
  { path: '/user-management', label: 'Users', icon: '⚙️', roles: ['ADMIN'] },
];

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Outlet />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role as string);
  });

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Text variant="subheading" className="sidebar-title">DOT Copilot</Text>
        </div>
        
        <nav className="sidebar-nav">
          {filteredNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <Text variant="body" className="user-name">{user?.name || user?.email}</Text>
            <Text variant="caption" className="user-role">{user?.role}</Text>
          </div>
          <Button variant="outline" size="small" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

