import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { EXAMS } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { ArrowLeft, Calendar, Clock, FileText, Users, Send, CheckCircle, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

const statusMap = {
  draft: { variant: 'warning', label: 'Draft' },
  published: { variant: 'success', label: 'Published' },
  'in-progress': { variant: 'info', label: 'In Progress' },
  completed: { variant: 'purple', label: 'Completed' },
};

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [assignModal, setAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ groupId: '', studentIds: [] });
  const [groups, setGroups] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetchExam(); fetchGroups(); }, [id]);

  const fetchExam = async () => {
    try {
      const res = await api.get(EXAMS.DETAIL(id));
      setExam(res.data.data || res.data.exam || res.data);
    } catch { toast.error('Failed to load exam'); navigate('/admin/exams'); }
    finally { setLoading(false); }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data.data || res.data.groups || []);
    } catch {}
  };

  const handleAssign = async () => {
    if (!assignForm.groupId) {
      toast.error('Please select a group');
      return;
    }

    setAssigning(true);
    try {
      const res = await api.post(EXAMS.ASSIGN, {
        examId: id,
        groups: [assignForm.groupId],
        students: []
      });

      const createdCount = res.data?.data?.assignments?.length ?? 0;
      if (createdCount === 0) {
        toast.error('No new assignments created (it may already be assigned).');
      } else {
        toast.success('Exam assigned!');
      }

      setAssignForm({ groupId: '', studentIds: [] });
      setAssignModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setAssigning(false); }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(EXAMS.UPDATE(id), { status: newStatus });
      setExam(res.data.data || res.data.exam || res.data);
      toast.success(`Exam status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!exam) return null;

  const st = statusMap[exam.status] || statusMap.draft;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-md">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/exams')} />
          <div>
            <h1 className="page-title">{exam.name}</h1>
            <div className="flex items-center gap-sm" style={{ marginTop: '0.25rem' }}>
              <Badge variant={st.variant} dot>{st.label}</Badge>
              <Badge variant="info" size="sm">{exam.category}</Badge>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <Button variant="secondary" icon={Edit2} onClick={() => navigate(`/admin/exams/${id}/edit`)}>Edit</Button>
          {exam.status === 'draft' && (
            <Button style={{ background: '#10b981', color: 'white' }} icon={CheckCircle} onClick={() => handleUpdateStatus('published')}>Publish</Button>
          )}
          {exam.status === 'published' && (
            <Button variant="secondary" onClick={() => handleUpdateStatus('draft')}>Revert to Draft</Button>
          )}
          <Button variant="secondary" icon={Send} onClick={() => setAssignModal(true)}>Assign</Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {[
          { icon: Calendar, label: 'Date', value: new Date(exam.date).toLocaleDateString(), color: 'blue' },
          { icon: Clock, label: 'Duration', value: `${exam.duration} mins`, color: 'purple' },
          { icon: FileText, label: 'Questions', value: exam.questions?.length || 0, color: 'emerald' },
          { icon: CheckCircle, label: 'Pass Mark', value: `${exam.passMark}/${exam.totalMarks}`, color: 'amber' },
        ].map((c, i) => (
          <div key={i} className="glass-card flex items-center gap-md">
            <div style={{ background: `var(--accent-${c.color}-glow, rgba(59,130,246,0.15))`, padding: '0.625rem', borderRadius: 'var(--radius-md)' }}>
              <c.icon size={18} style={{ color: `var(--accent-${c.color})` }} />
            </div>
            <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.label}</p>
              <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>{c.value}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-xs" style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        {['overview', 'questions', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize',
            color: tab === t ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
            transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '0.75rem', fontWeight: 700 }}>Description</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{exam.description || 'No description provided.'}</p>
          {exam.instructions && <>
            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem', fontWeight: 700 }}>Instructions</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{exam.instructions}</p>
          </>}
        </div>
      )}

      {tab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(exam.questions || []).map((q, i) => (
            <div key={i} className="glass-card">
              <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                <h4>Q{i + 1}. {q.question}</h4>
                <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'danger' : 'warning'} size="sm">{q.difficulty}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                {['A', 'B', 'C', 'D'].map(opt => (
                  <div key={opt} style={{
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem',
                    background: q.correctAnswer === opt ? 'rgba(16,185,129,0.15)' : 'var(--bg-glass)',
                    border: q.correctAnswer === opt ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)',
                    color: q.correctAnswer === opt ? '#10b981' : 'var(--text-secondary)',
                  }}>
                    <strong>{opt}.</strong> {q.options?.[opt]}
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Marks: {q.marks}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'settings' && (
        <div className="glass-card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {Object.entries(exam.settings || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center" style={{ padding: '0.625rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                <span style={{ fontWeight: 600, color: typeof v === 'boolean' ? (v ? '#10b981' : '#f43f5e') : 'var(--text-primary)' }}>
                  {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Exam" size="sm"
        footer={<><Button variant="secondary" onClick={() => setAssignModal(false)}>Cancel</Button>
          <Button onClick={handleAssign} loading={assigning}>Assign</Button></>}>
        <div className="form-group">
          <label className="form-label">Select Group</label>
          <select className="form-select" value={assignForm.groupId} onChange={e => setAssignForm(p => ({ ...p, groupId: e.target.value }))}>
            <option value="">Choose a group</option>
            {groups.map(g => <option key={g._id} value={g._id}>{g.name}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
