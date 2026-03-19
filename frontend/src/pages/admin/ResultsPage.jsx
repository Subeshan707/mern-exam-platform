import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { RESULTS } from '../../api/endpoints';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { Trophy, Eye, CheckCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchResults(); }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get(RESULTS.LIST);
      setResults(res.data.data || res.data.results || []);
    } catch { toast.error('Failed to load results'); }
    finally { setLoading(false); }
  };

  const publishResults = async (examId) => {
    try {
      await api.put(RESULTS.PUBLISH(examId));
      toast.success('Results published!');
      fetchResults();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = results.filter(r =>
    r.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.exam?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Results</h1><p className="page-subtitle">View and publish exam results</p></div>
        <div className="page-actions"><SearchInput placeholder="Search results..." onSearch={setSearch} /></div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Trophy} title="No results yet" message="Results will appear here after exams are completed." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Exam</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 600 }}>{r.student?.name || 'N/A'}</td>
                  <td>{r.exam?.name || 'N/A'}</td>
                  <td>{r.marksObtained}/{r.totalMarks}</td>
                  <td><span style={{ fontWeight: 700, color: r.percentage >= 60 ? '#10b981' : r.percentage >= 40 ? '#f59e0b' : '#f43f5e' }}>{r.percentage?.toFixed(1)}%</span></td>
                  <td><Badge variant={r.isPass ? 'success' : 'danger'}>{r.grade || (r.isPass ? 'Pass' : 'Fail')}</Badge></td>
                  <td><Badge variant={r.isPublished ? 'success' : 'warning'} dot>{r.isPublished ? 'Published' : 'Draft'}</Badge></td>
                  <td>
                    <div className="flex gap-xs">
                      {!r.isPublished && <Button variant="ghost" size="sm" icon={Upload} onClick={() => publishResults(r.exam?._id)} title="Publish" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
