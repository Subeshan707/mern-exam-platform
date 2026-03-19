import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { DASHBOARD } from '../../api/endpoints';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Users, FileText, Trophy, GraduationCap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const toArray = (value) => (Array.isArray(value) ? value : []);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get(DASHBOARD.ADMIN);
      const payload = res.data?.data || res.data || {};
      const counts = payload.counts || {};
      const examStats = toArray(payload.examStats).map(stat => ({
        name: stat.name || 'Unknown',
        students: Number(stat.students) || 0,
        avgScore: Number(stat.avgScore) || 0,
      }));

      const passCount = Number(payload.passFailRatio?.pass) || 0;
      const failCount = Number(payload.passFailRatio?.fail) || 0;

      setData({
        totalStudents: Number(counts.totalStudents) || 0,
        totalExams: Number(counts.totalExams) || 0,
        totalGroups: Number(counts.totalGroups) || 0,
        totalResults: Number(counts.totalResults) || toArray(payload.recentResults).length,
        activeExams: Number(counts.ongoingExams) || 0,
        completedExams: 0,
        recentExams: toArray(payload.recentExams),
        examStats,
        passFailData: [
          { name: 'Pass', value: passCount },
          { name: 'Fail', value: failCount },
        ],
      });
    } catch (err) {
      toast.error('Failed to load dashboard');
      setData({
        totalStudents: 0, totalExams: 0, totalGroups: 0, totalResults: 0,
        activeExams: 0, completedExams: 0, recentExams: [], examStats: [],
        passFailData: [{ name: 'Pass', value: 0 }, { name: 'Fail', value: 0 }],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const CHART_COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: '#ffffff', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)', padding: '0.75rem',
        boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)',
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem', textTransform: 'capitalize' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }}/>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* 1. Creative Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-shape s1" />
        <div className="welcome-shape s2" />
        <div className="welcome-shape s3" />
        <div className="welcome-content">
          <h1>Welcome back, Admin!</h1>
          <p>Here's what's happening on ExamPro today. You have <strong>{data?.activeExams || 0}</strong> ongoing exams and <strong>{data?.totalStudents || 0}</strong> registered students across the platform.</p>
        </div>
      </div>

      <div className="bento-grid">
        
        {/* 2. Bento Stats Row */}
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Total Students" value={data?.totalStudents || 0} icon={GraduationCap} color="blue" subtitle="Registered Students" />
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Total Exams" value={data?.totalExams || 0} icon={FileText} color="purple" subtitle="Platform Exams" />
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Groups" value={data?.totalGroups || 0} icon={Users} color="emerald" subtitle="Active Cohorts" />
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Results" value={data?.totalResults || 0} icon={Trophy} color="amber" subtitle="Published Scores" />
        </div>

        {/* 3. Performance Bar Chart */}
        <div className="bento-item" style={{ gridColumn: 'span 8', gridRow: 'span 2' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Performance Trends</h3>
          <div style={{ flex: 1, minHeight: 320 }}>
            {data?.examStats?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.examStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} style={{ textTransform: 'capitalize' }} />
                  <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="students" fill="#3b82f6" name="Total Students" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar yAxisId="right" dataKey="avgScore" fill="#8b5cf6" name="Avg Score" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Not enough data yet</div>
            )}
          </div>
        </div>

        {/* 4. Pass/Fail Donut */}
        <div className="bento-item" style={{ gridColumn: 'span 4' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Pass/Fail Ratio</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>Overall student success distribution</p>
          <div style={{ flex: 1, minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.passFailData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" >
                  {data?.passFailData.map((_, index) => ( <Cell key={index} fill={CHART_COLORS[index]} /> ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Quick Actions */}
        <div className="bento-item" style={{ gridColumn: 'span 4' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <button className="quick-action-btn" onClick={() => navigate('/admin/exams/new')}>
              <FileText size={18} /> Create New Exam
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/students')}>
              <Users size={18} /> Manage Students
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/admin/reports')}>
              <TrendingUp size={18} /> View Reports
            </button>
          </div>
        </div>

        {/* 6. Recent Exams Table taking full bottom width */}
        <div className="bento-item" style={{ gridColumn: 'span 12' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Exams</h3>
            <button style={{ color: 'var(--accent-blue)', fontSize: '0.875rem', fontWeight: 600 }} onClick={() => navigate('/admin/exams')}>View All →</button>
          </div>
          {(toArray(data?.recentExams).length === 0) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No exams created yet. Create your first exam to get started!
            </p>
          ) : (
            <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead style={{ background: 'transparent' }}>
                  <tr>
                    <th style={{ paddingLeft: 0 }}>Exam Name</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ paddingRight: 0, textAlign: 'right' }}>Students</th>
                  </tr>
                </thead>
                <tbody>
                  {toArray(data?.recentExams).map(exam => (
                    <tr key={exam._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/exams/${exam._id}`)}>
                      <td style={{ fontWeight: 600, paddingLeft: 0 }}>{exam.name}</td>
                      <td><span style={{ fontSize: '0.8125rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{exam.category}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Date(exam.date).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
                          background: exam.status === 'published' ? 'rgba(16,185,129,0.15)' : exam.status === 'draft' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                          color: exam.status === 'published' ? '#10b981' : exam.status === 'draft' ? '#f59e0b' : '#3b82f6',
                        }}>
                          {exam.status}
                        </span>
                      </td>
                      <td style={{ paddingRight: 0, textAlign: 'right', fontWeight: 500 }}>{exam.totalStudents || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
