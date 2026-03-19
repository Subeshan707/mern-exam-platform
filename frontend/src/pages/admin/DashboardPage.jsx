import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { DASHBOARD } from '../../api/endpoints';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Users, FileText, Trophy, GraduationCap, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
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
      const statusStats = payload.examStats || {};

      const examStats = Object.entries(statusStats).map(([name, count]) => ({
        name,
        students: Number(count) || 0,
        avgScore: 0,
      }));

      const passCount = Number(payload.trends?.passFail?.pass) || 0;
      const failCount = Number(payload.trends?.passFail?.fail) || 0;

      setData({
        totalStudents: Number(counts.totalStudents) || 0,
        totalExams: Number(counts.totalExams) || 0,
        totalGroups: Number(counts.totalGroups) || 0,
        totalResults: Number(counts.totalResults) || toArray(payload.recentResults).length,
        activeExams: Number(counts.ongoingExams) || 0,
        completedExams: Number(statusStats.completed) || 0,
        recentExams: toArray(payload.upcomingExams),
        examStats,
        passFailData: [
          { name: 'Pass', value: passCount },
          { name: 'Fail', value: failCount },
        ],
      });
    } catch (err) {
      toast.error('Failed to load dashboard');
      // Set mock data for demo
      setData({
        totalStudents: 0,
        totalExams: 0,
        totalGroups: 0,
        totalResults: 0,
        activeExams: 0,
        completedExams: 0,
        recentExams: [],
        examStats: [],
        passFailData: [
          { name: 'Pass', value: 0 },
          { name: 'Fail', value: 0 }
        ],
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
        background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)', padding: '0.75rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, fontSize: '0.8125rem' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your overview.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatsCard title="Total Students" value={data?.totalStudents || 0} icon={GraduationCap} color="blue" subtitle="Registered students" />
        <StatsCard title="Total Exams" value={data?.totalExams || 0} icon={FileText} color="purple" subtitle="Created exams" />
        <StatsCard title="Groups" value={data?.totalGroups || 0} icon={Users} color="emerald" subtitle="Active groups" />
        <StatsCard title="Results" value={data?.totalResults || 0} icon={Trophy} color="amber" subtitle="Published results" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        {/* Exam Performance Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Exam Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={toArray(data?.examStats)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score" />
              <Bar dataKey="students" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pass/Fail Pie */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Pass/Fail Ratio</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={toArray(data?.passFailData)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {toArray(data?.passFailData).map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Exams */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Recent Exams</h3>
        {(toArray(data?.recentExams).length === 0) ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No exams created yet. Create your first exam to get started!
          </p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {toArray(data?.recentExams).map(exam => (
                  <tr key={exam._id}>
                    <td style={{ fontWeight: 600 }}>{exam.name}</td>
                    <td>{exam.category}</td>
                    <td>{new Date(exam.date).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem',
                        fontWeight: 600, textTransform: 'capitalize',
                        background: exam.status === 'published' ? 'rgba(16,185,129,0.15)' :
                                   exam.status === 'draft' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                        color: exam.status === 'published' ? '#10b981' :
                               exam.status === 'draft' ? '#f59e0b' : '#3b82f6',
                      }}>
                        {exam.status}
                      </span>
                    </td>
                    <td>{exam.totalStudents || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
