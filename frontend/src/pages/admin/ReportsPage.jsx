import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { REPORTS } from '../../api/endpoints';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BarChart3, Users, FileText, Trophy, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const toArray = (value) => (Array.isArray(value) ? value : []);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(REPORTS.ANALYTICS);
      const payload = res.data?.data || res.data || {};
      const overview = payload.overview || {};
      const attempts = toArray(payload.trends?.attemptsOverTime);

      const monthlyData = attempts.map((item) => ({
        month: `${item?._id?.day || 0}/${item?._id?.month || 0}`,
        exams: Number(item?.count) || 0,
        students: 0,
      }));

      const performanceData = attempts.map((item) => ({
        month: `${item?._id?.day || 0}/${item?._id?.month || 0}`,
        avgScore: 0,
        passRate: 0,
      }));

      setAnalytics({
        totalStudents: Number(overview.totalStudents) || 0,
        totalExams: Number(overview.totalExams) || 0,
        avgPassRate: 0,
        totalAttempts: attempts.reduce((sum, item) => sum + (Number(item?.count) || 0), 0),
        monthlyData,
        performanceData,
      });
    } catch {
      setAnalytics({
        totalStudents: 0, totalExams: 0, avgPassRate: 0, totalAttempts: 0,
        monthlyData: [], performanceData: []
      });
    } finally { setLoading(false); }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((e, i) => <p key={i} style={{ color: e.color, fontSize: '0.8125rem' }}>{e.name}: {e.value}</p>)}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Comprehensive platform analytics</p></div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatsCard title="Total Students" value={analytics?.totalStudents || 0} icon={Users} color="blue" />
        <StatsCard title="Total Exams" value={analytics?.totalExams || 0} icon={FileText} color="purple" />
        <StatsCard title="Avg Pass Rate" value={`${analytics?.avgPassRate || 0}%`} icon={TrendingUp} color="emerald" />
        <StatsCard title="Total Attempts" value={analytics?.totalAttempts || 0} icon={Trophy} color="amber" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Monthly Exams</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={toArray(analytics?.monthlyData)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="exams" fill="#3b82f6" radius={[4,4,0,0]} name="Exams" />
              <Bar dataKey="students" fill="#8b5cf6" radius={[4,4,0,0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Performance Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={toArray(analytics?.performanceData)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Avg Score" />
              <Line type="monotone" dataKey="passRate" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Pass Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
