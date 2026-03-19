import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { RESULTS } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Trophy, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(RESULTS.MY_RESULTS)
      .then(r => setResults(r.data.data || r.data.results || []))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">My Results</h1><p className="page-subtitle">Your examination results</p></div>
      </div>

      {results.length === 0 ? (
        <EmptyState icon={Trophy} title="No results yet" message="Your results will show here after exams are graded." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-md)' }}>
          {results.map(r => (
            <div key={r._id} className="glass-card" style={{ overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: r.isPass ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#f43f5e,#e11d48)' }} />
              <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{r.exam?.name || 'Exam'}</h3>
                <Badge variant={r.isPass ? 'success' : 'danger'}>{r.grade || (r.isPass ? 'Pass' : 'Fail')}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
                <div style={{
                  width: 100, height: 100, borderRadius: '50%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  border: `4px solid ${r.isPass ? '#10b981' : '#f43f5e'}`,
                  background: r.isPass ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: r.isPass ? '#10b981' : '#f43f5e' }}>
                    {r.percentage?.toFixed(0)}%
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Score</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Marks</p>
                  <p style={{ fontWeight: 700 }}>{r.marksObtained}/{r.totalMarks}</p>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Rank</p>
                  <p style={{ fontWeight: 700 }}>{r.rank || '-'}/{r.totalStudents || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
