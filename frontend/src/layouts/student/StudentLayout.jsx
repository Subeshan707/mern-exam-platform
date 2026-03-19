import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Trophy, User, LogOut, GraduationCap, Menu, X
} from 'lucide-react';
import { useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="student-layout">
      {/* Top navbar */}
      <header className="student-header">
        <div className="student-header-inner">
          <div className="student-brand">
            <div className="brand-icon-sm">
              <GraduationCap size={20} />
            </div>
            <span className="brand-text-sm">ExamPro</span>
          </div>

          <nav className="student-nav desktop-nav">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="student-header-right">
            <div className="student-user-info">
              <div className="profile-avatar" style={{ width: 30, height: 30, fontSize: '0.75rem' }}>
                {user?.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <span className="student-name">{user?.name || 'Student'}</span>
            </div>
            <button className="header-icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
            <button className="mobile-menu-btn mobile-only" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="student-mobile-nav animate-fade-in-up">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="student-content">
        <Outlet />
      </main>
    </div>
  );
}
