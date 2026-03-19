import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { EXAMS } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Eye, Trash2, FileText, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const statusMap = {
  draft: { variant: 'warning', label: 'Draft' },
  published: { variant: 'success', label: 'Published' },
  'in-progress': { variant: 'info', label: 'In Progress' },
  completed: { variant: 'purple', label: 'Completed' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

export default function ExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get(EXAMS.LIST);
      setExams(res.data.data || res.data.exams || []);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(EXAMS.DELETE(deleteId));
      toast.success('Exam deleted!');
      setDeleteId(null);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setDeleting(false); }
  };

  const filtered = exams.filter(e => {
    const ms = e.name?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'all' || e.status === filter;
    return ms && mf;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Exams</h1><p className="page-subtitle">Create and manage examinations</p></div>
        <div className="page-actions">
          <SearchInput placeholder="Search exams..." onSearch={setSearch} />
          <select className="form-select" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All</option><option value="draft">Draft</option>
            <option value="published">Published</option><option value="completed">Completed</option>
          </select>
          <Button icon={Plus} onClick={() => navigate('/admin/exams/new')}>Create Exam</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No exams found" message="Create your first exam."
          action={<Button icon={Plus} onClick={() => navigate('/admin/exams/new')}>Create Exam</Button>} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-md)' }}>
          {filtered.map(exam => {
            const st = statusMap[exam.status] || statusMap.draft;
            return (
              <div key={exam._id} className="glass-card" style={{ cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                onClick={() => navigate(`/admin/exams/${exam._id}`)}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: st.variant === 'success' ? 'linear-gradient(90deg,#10b981,#059669)' :
                    st.variant === 'warning' ? 'linear-gradient(90deg,#f59e0b,#d97706)' :
                    'linear-gradient(90deg,#3b82f6,#6366f1)' }} />
                <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{exam.name}</h3>
                  <Badge variant={st.variant} dot size="sm">{st.label}</Badge>
                </div>
                <div className="flex gap-md" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  <span className="flex items-center gap-xs"><Calendar size={13}/>{new Date(exam.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-xs"><Clock size={13}/>{exam.duration}m</span>
                  <span className="flex items-center gap-xs"><FileText size={13}/>{exam.questions?.length||0} Q</span>
                </div>
                <div className="flex justify-between items-center" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Total: {exam.totalMarks||0} | Pass: {exam.passMark||0}</span>
                  <div className="flex gap-xs" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" icon={Eye} onClick={() => navigate(`/admin/exams/${exam._id}`)} />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(exam._id)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete Exam" message="Delete this exam and all related data?" />
    </div>
  );
}
