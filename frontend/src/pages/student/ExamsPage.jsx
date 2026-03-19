import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { EXAMS } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { FileText, Calendar, Clock, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchExams = async ({ silent = false } = {}) => {
    try {
      const [assignedRes, ongoingRes] = await Promise.all([
        api.get(EXAMS.LIST),
        api.get(EXAMS.STUDENT_ONGOING),
      ]);

      const assignedExams = Array.isArray(assignedRes?.data?.data)
        ? assignedRes.data.data
        : [];

      const ongoing = Array.isArray(ongoingRes?.data?.data)
        ? ongoingRes.data.data
        : [];

      const ongoingByExamId = new Map(
        ongoing
          .filter((item) => item?.exam?._id)
          .map((item) => [String(item.exam._id), item])
      );

      const merged = assignedExams
        .map((exam) => {
          const ongoingExam = ongoingByExamId.get(String(exam._id));

          const now = new Date();
          const examStart = new Date(exam.date);
          const [hours, minutes] = (exam.startTime || '00:00').split(':').map(Number);
          examStart.setHours(hours || 0, minutes || 0, 0, 0);
          const examEnd = new Date(examStart.getTime() + (Number(exam.duration) || 0) * 60000);

          let status = 'pending';
          if (ongoingExam) {
            status = 'started';
          } else if (now < examStart) {
            status = 'not-started';
          } else if (now > examEnd) {
            status = 'ended';
          } else if (exam.status === 'completed') {
            status = 'completed';
          }

          return {
            _id: ongoingExam?.attempt?.id || exam._id,
            exam,
            attempt: ongoingExam?.attempt || null,
            status,
            examStart,
            examEnd,
          };
        })
        .sort((a, b) => new Date(a.exam?.date || 0) - new Date(b.exam?.date || 0));

      setExams(merged);
    } catch {
      if (!silent) {
        toast.error('Failed to load exams');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchExams();

    const intervalId = setInterval(() => {
      fetchExams({ silent: true });
    }, 30000);

    const onFocus = () => fetchExams({ silent: true });
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
        <div><h1 className="page-title">My Exams</h1><p className="page-subtitle">Your assigned examinations</p></div>
      </div>

      {exams.length === 0 ? (
        <EmptyState icon={FileText} title="No exams assigned" message="Check back later for new exam assignments." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-md)' }}>
          {exams.map(item => {
            const exam = item.exam || item;
            const status = item.status || 'pending';
            const startText = item.examStart ? item.examStart.toLocaleString() : 'N/A';
            const endText = item.examEnd ? item.examEnd.toLocaleString() : 'N/A';
            return (
              <div key={item._id || exam._id} className="glass-card" style={{ overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: status === 'completed' ? 'linear-gradient(90deg,#10b981,#059669)' :
                    status === 'ended' ? 'linear-gradient(90deg,#ef4444,#dc2626)' :
                    status === 'started' ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                    'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{exam.name}</h3>
                  <Badge variant={
                    status === 'completed' ? 'success' :
                    status === 'ended' ? 'danger' :
                    status === 'started' ? 'warning' : 'info'
                  } dot size="sm">
                    {status}
                  </Badge>
                </div>
                <div className="flex gap-md" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <span className="flex items-center gap-xs"><Calendar size={13}/>{new Date(exam.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-xs"><Clock size={13}/>{exam.duration}m</span>
                  <span className="flex items-center gap-xs"><FileText size={13}/>{exam.questions?.length || '?'} Q</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Starts: {startText}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Ends: {endText}
                </p>

                {status === 'not-started' && (
                  <p style={{ fontSize: '0.75rem', color: '#60a5fa', marginBottom: '1rem' }}>
                    This exam has not started yet.
                  </p>
                )}

                {status === 'ended' && (
                  <p style={{ fontSize: '0.75rem', color: '#f87171', marginBottom: '1rem' }}>
                    This exam has ended.
                  </p>
                )}

                {(status === 'started' || status === 'pending') && exam.status !== 'completed' && (
                  <Button icon={Play} fullWidth onClick={() => navigate(`/student/exams/${exam._id}/take`)}>
                    {status === 'started' ? 'Continue Exam' : 'Start Exam'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
