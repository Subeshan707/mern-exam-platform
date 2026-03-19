import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Hash } from 'lucide-react';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function LoginPage() {
  const [tab, setTab] = useState('admin');
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { adminLogin, studentLogin, adminRegister, studentRegister } = useAuth();
  const navigate = useNavigate();

  // Admin form
  const [adminForm, setAdminForm] = useState({ username: '', email: '', password: '' });
  // Student form
  const [studentForm, setStudentForm] = useState({ name: '', rollNumber: '', email: '', group: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        if (tab === 'admin') {
          await adminLogin(adminForm.email, adminForm.password);
          toast.success('Welcome back, Admin!');
          navigate('/admin');
        } else {
          await studentLogin(studentForm.rollNumber, studentForm.password);
          toast.success('Welcome back!');
          navigate('/student');
        }
      } else {
        if (tab === 'admin') {
          await adminRegister({
            username: adminForm.username,
            email: adminForm.email,
            password: adminForm.password,
          });
          toast.success('Admin account created');
          navigate('/admin');
        } else {
          await studentRegister({
            name: studentForm.name,
            rollNumber: studentForm.rollNumber,
            email: studentForm.email,
            group: studentForm.group,
            password: studentForm.password,
          });
          toast.success('Student account created');
          navigate('/student');
        }
      }
    } catch (err) {
      const validationError = err.response?.data?.errors?.[0]?.msg;
      toast.error(validationError || err.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-grid" />
      </div>

      <div className="login-container animate-scale-in">
        {/* Left panel */}
        <div className="login-left">
          <div className="login-left-content">
            <div className="login-brand">
              <div className="login-brand-icon">
                <GraduationCap size={32} />
              </div>
              <h1>ExamPro</h1>
            </div>
            <h2>Online Examination Platform</h2>
            <p>Conduct secure, proctored exams with real-time monitoring, instant grading, and comprehensive analytics.</p>
            <div className="login-features">
              <div className="feature-item">
                <div className="feature-dot" />
                <span>AI-Powered Proctoring</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot" />
                <span>Real-time Analytics</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot" />
                <span>Instant Results</span>
              </div>
              <div className="feature-item">
                <div className="feature-dot" />
                <span>Secure & Reliable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-tabs">
              <button
                className={`login-tab ${tab === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setTab('admin');
                  setMode('login');
                }}
              >
                <User size={16} />
                Admin Login
              </button>
              <button
                className={`login-tab ${tab === 'student' ? 'active' : ''}`}
                onClick={() => {
                  setTab('student');
                  setMode('login');
                }}
              >
                <GraduationCap size={16} />
                Student Login
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`login-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
                style={{ flex: 1 }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`login-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => setMode('register')}
                style={{ flex: 1 }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {tab === 'admin' ? (
                <>
                  {mode === 'register' && (
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <div className="input-with-icon">
                        <User size={16} className="input-icon" />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter admin username"
                          value={adminForm.username}
                          onChange={e => setAdminForm(p => ({ ...p, username: e.target.value }))}
                          required
                          style={{ paddingLeft: '2.5rem' }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="admin@examplatform.com"
                        value={adminForm.email}
                        onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))}
                        required
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter your password"
                        value={adminForm.password}
                        onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))}
                        required
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {mode === 'register' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-with-icon">
                          <User size={16} className="input-icon" />
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Student full name"
                            value={studentForm.name}
                            onChange={e => setStudentForm(p => ({ ...p, name: e.target.value }))}
                            required
                            style={{ paddingLeft: '2.5rem' }}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-with-icon">
                          <Mail size={16} className="input-icon" />
                          <input
                            type="email"
                            className="form-input"
                            placeholder="student@example.com"
                            value={studentForm.email}
                            onChange={e => setStudentForm(p => ({ ...p, email: e.target.value }))}
                            required
                            style={{ paddingLeft: '2.5rem' }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <div className="input-with-icon">
                      <Hash size={16} className="input-icon" />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. STU-001"
                        value={studentForm.rollNumber}
                        onChange={e => setStudentForm(p => ({ ...p, rollNumber: e.target.value.toUpperCase() }))}
                        required
                        style={{ paddingLeft: '2.5rem' }}
                      />
                    </div>
                  </div>
                  {mode === 'register' && (
                    <div className="form-group">
                      <label className="form-label">Group ID</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="MongoDB group id"
                        value={studentForm.group}
                        onChange={e => setStudentForm(p => ({ ...p, group: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-with-icon">
                      <Lock size={16} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter your password"
                        value={studentForm.password}
                        onChange={e => setStudentForm(p => ({ ...p, password: e.target.value }))}
                        required
                        style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
                {mode === 'login'
                  ? (tab === 'admin' ? 'Sign In as Admin' : 'Sign In as Student')
                  : (tab === 'admin' ? 'Register Admin' : 'Register Student')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
