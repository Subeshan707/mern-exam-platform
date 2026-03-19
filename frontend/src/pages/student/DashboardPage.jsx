import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { DASHBOARD } from '../../api/endpoints';
import StatsCard from '../../components/ui/StatsCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { FileText, Trophy, Clock, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeDashboardData = (payload) => {
    const source = payload || {};
    const exams = source.exams || {};
    const statistics = source.statistics || source.stats || {};

    const upcomingExams = Array.isArray(source.upcomingExams)
      ? source.upcomingExams
      : Array.isArray(exams.upcoming)
        ? exams.upcoming
        : [];

    return {
      upcomingExams,
      recentResults: Array.isArray(source.recentResults) ? source.recentResults : [],
      stats: {
        upcomingExams: Number(statistics.upcomingExams) || upcomingExams.length,
        completedExams: Number(statistics.completedExams ?? statistics.completedAttempts) || 0,
        avgScore: Number(statistics.avgScore ?? statistics.averageScore) || 0,
        totalExams: Number(statistics.totalExams) || 0,
      }
    };
  };

  const fetchDashboard = async ({ silent = false } = {}) => {
    try {
      const res = await api.get(DASHBOARD.STUDENT);
      setData(normalizeDashboardData(res.data?.data || res.data));
    } catch {
      if (!silent) {
        setData({ upcomingExams: [], recentResults: [], stats: {} });
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboard();

    const intervalId = setInterval(() => {
      fetchDashboard({ silent: true });
    }, 30000);

    const onFocus = () => fetchDashboard({ silent: true });
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name || 'Student'}!</h1>
          <p className="page-subtitle">Here's your exam overview</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        <StatsCard title="Upcoming Exams" value={data?.stats?.upcomingExams ?? data?.upcomingExams?.length ?? 0} icon={Calendar} color="blue" />
        <StatsCard title="Completed" value={data?.stats?.completedExams ?? 0} icon={CheckCircle} color="emerald" />
        <StatsCard title="Avg Score" value={`${data?.stats?.avgScore ?? 0}%`} icon={Trophy} color="amber" />
        <StatsCard title="Total Exams" value={data?.stats?.totalExams ?? 0} icon={FileText} color="purple" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Upcoming Exams</h3>
          {(!data?.upcomingExams?.length) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No upcoming exams</p>
          ) : data.upcomingExams.map(exam => (
            <div key={exam._id} style={{
              padding: '0.875rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
              marginBottom: '0.5rem', cursor: 'pointer', border: '1px solid var(--border-color)',
              transition: 'all 0.2s',
            }} onClick={() => navigate('/student/exams')}>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 600 }}>{exam.exam?.name || exam.name}</span>
                <Badge variant="info" size="sm">{exam.exam?.duration || exam.duration}m</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {new Date(exam.exam?.date || exam.date).toLocaleDateString()} at {exam.exam?.startTime || exam.startTime}
              </p>
            </div>
          ))}
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-md)' }}>Recent Results</h3>
          {(!data?.recentResults?.length) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No results yet</p>
          ) : data.recentResults.map(r => (
            <div key={r._id} style={{
              padding: '0.875rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)',
              marginBottom: '0.5rem', border: '1px solid var(--border-color)',
            }}>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 600 }}>{r.exam?.name || 'Exam'}</span>
                <Badge variant={r.isPass ? 'success' : 'danger'}>{r.grade || (r.isPass ? 'Pass' : 'Fail')}</Badge>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Score: {r.marksObtained}/{r.totalMarks} ({Number(r.percentage || 0).toFixed(1)}%)
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
