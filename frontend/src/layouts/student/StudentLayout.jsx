import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Trophy, User, LogOut, Menu, ChevronDown, Bell, GraduationCap
} from 'lucide-react';
import './StudentLayout.css';

const navItems = [
  { to: '/student',          icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/student/exams',    icon: FileText,         label: 'My Exams' },
  { to: '/student/results',  icon: Trophy,           label: 'Results' },
  { to: '/student/profile',  icon: User,             label: 'Profile' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="student-layout">
      {/* Sidebar — hover to expand */}
      <aside className={`student-sidebar ${mobileOpen ? 'mobile-open expanded' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <GraduationCap size={24} />
            </div>
            <span className="brand-text">ExamPro</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="student-main">
        {/* Header */}
        <header className="student-header">
          <div className="header-left">
            <button className="mobile-menu-btn mobile-only" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                ExamPro 
              </h1>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
                Welcome back, {user?.name || user?.username}!
              </span>
            </div>
          </div>

          <div className="header-right">
            <button className="header-icon-btn">
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <div className="profile-dropdown" onClick={() => setProfileOpen(!profileOpen)}>
              <div className="profile-avatar">
                {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'S'}
              </div>
              <span className="profile-name">{user?.name || user?.username || 'Student'}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />

              {profileOpen && (
                <div className="dropdown-menu animate-fade-in-up">
                  <button className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
