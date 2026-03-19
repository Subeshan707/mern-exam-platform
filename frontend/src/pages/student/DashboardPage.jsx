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
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* 1. Creative Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-shape s1" />
        <div className="welcome-shape s2" />
        <div className="welcome-shape s3" />
        <div className="welcome-content">
          <h1>Welcome back, {user?.name || 'Student'}!</h1>
          <p>Here's your learning overview. You have <strong>{data?.stats?.upcomingExams ?? data?.upcomingExams?.length ?? 0}</strong> upcoming exams and an average score of <strong>{data?.stats?.avgScore ?? 0}%</strong>.</p>
        </div>
      </div>

      <div className="bento-grid">
        
        {/* 2. Bento Stats Row */}
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Upcoming Exams" value={data?.stats?.upcomingExams ?? data?.upcomingExams?.length ?? 0} icon={Calendar} color="blue" subtitle="Scheduled tests" />
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Completed" value={data?.stats?.completedExams ?? 0} icon={CheckCircle} color="emerald" subtitle="Exams finished" />
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Avg Score" value={`${data?.stats?.avgScore ?? 0}%`} icon={Trophy} color="amber" subtitle="Overall performance" />
        </div>
        <div className="bento-item" style={{ gridColumn: 'span 3' }}>
          <StatsCard title="Total Assigned" value={data?.stats?.totalExams ?? 0} icon={FileText} color="purple" subtitle="All platform exams" />
        </div>

        {/* 3. Upcoming Exams (Left Half) */}
        <div className="bento-item" style={{ gridColumn: 'span 6', minHeight: '350px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Upcoming Exams</h3>
            <button style={{ color: 'var(--accent-blue)', fontSize: '0.875rem', fontWeight: 600 }} onClick={() => navigate('/student/exams')}>View All →</button>
          </div>
          {(!data?.upcomingExams?.length) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No upcoming exams scheduled right now.</p>
          ) : data.upcomingExams.map(exam => (
            <div key={exam._id} style={{
              padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
              marginBottom: '0.75rem', cursor: 'pointer', border: '1px solid var(--border-color)',
              transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem'
            }} onClick={() => navigate('/student/exams')}
               onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
               onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none' }}
            >
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 600, fontSize: '1rem' }}>{exam.exam?.name || exam.name}</span>
                <Badge variant="info" size="sm"><Clock size={14} style={{ marginRight: '4px', display: 'inline' }}/>{exam.exam?.duration || exam.duration}m</Badge>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Calendar size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'text-bottom' }} />
                {new Date(exam.exam?.date || exam.date).toLocaleDateString()} at {exam.exam?.startTime || exam.startTime}
              </p>
            </div>
          ))}
        </div>

        {/* 4. Recent Results (Right Half) */}
        <div className="bento-item" style={{ gridColumn: 'span 6', minHeight: '350px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Results</h3>
            <button style={{ color: 'var(--accent-blue)', fontSize: '0.875rem', fontWeight: 600 }} onClick={() => navigate('/student/results')}>View All →</button>
          </div>
          {(!data?.recentResults?.length) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>You haven't completed any exams yet.</p>
          ) : data.recentResults.map(r => (
            <div key={r._id} style={{
              padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
              marginBottom: '0.75rem', border: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>{r.exam?.name || 'Exam'}</span>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Score: <strong style={{color: 'var(--text-primary)'}}>{r.marksObtained}/{r.totalMarks}</strong> ({Number(r.percentage || 0).toFixed(1)}%)
                </p>
              </div>
              <Badge variant={r.isPass ? 'success' : 'danger'} size="lg">{r.grade || (r.isPass ? 'Pass' : 'Fail')}</Badge>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
