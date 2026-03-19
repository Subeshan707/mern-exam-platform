import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { STUDENTS, GROUPS } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, GraduationCap, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', rollNumber: '', email: '', password: '', group: '', contactNumber: '' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [studRes, grpRes] = await Promise.all([
        api.get(STUDENTS.LIST),
        api.get(GROUPS.LIST),
      ]);
      setStudents(studRes.data.data || studRes.data.students || []);
      setGroups(grpRes.data.data || grpRes.data.groups || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const { password, ...updateData } = form;
        await api.put(STUDENTS.UPDATE(editing), updateData);
        toast.success('Student updated!');
      } else {
        await api.post(STUDENTS.CREATE, form);
        toast.success('Student created!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (student) => {
    setEditing(student._id);
    setForm({
      name: student.name, rollNumber: student.rollNumber, email: student.email,
      password: '', group: student.group?._id || student.group, contactNumber: student.contactNumber || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(STUDENTS.DELETE(deleteId));
      toast.success('Student deleted!');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      await api.patch(STUDENTS.TOGGLE_STATUS(id));
      toast.success('Status updated!');
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading students..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="page-subtitle">Manage student accounts and access</p>
        </div>
        <div className="page-actions">
          <SearchInput placeholder="Search students..." onSearch={setSearch} />
          <Button icon={Plus} onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true); }}>
            Add Student
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          message="Add students to begin managing exams."
          action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Add Student</Button>}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Email</th>
                <th>Group</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => (
                <tr key={student._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-emerald), #059669)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0,
                      }}>
                        {student.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{student.name}</span>
                    </div>
                  </td>
                  <td><code style={{ background: 'var(--bg-glass)', padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.8125rem' }}>{student.rollNumber}</code></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{student.email}</td>
                  <td><Badge variant="info">{student.group?.name || 'Unassigned'}</Badge></td>
                  <td><Badge variant={student.isActive ? 'success' : 'danger'} dot>{student.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleEdit(student)} title="Edit" />
                      <Button variant="ghost" size="sm" icon={student.isActive ? ToggleRight : ToggleLeft} onClick={() => toggleStatus(student._id)} title="Toggle status" />
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(student._id)} title="Delete" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Student' : 'Add Student'} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number *</label>
                <input className="form-input" value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value.toUpperCase() }))} required placeholder="STU-001" disabled={!!editing} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="john@email.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Group *</label>
                <select className="form-select" value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))} required>
                  <option value="">Select group</option>
                  {groups.map(g => <option key={g._id} value={g._id}>{g.name} - {g.year}</option>)}
                </select>
              </div>
            </div>
            {!editing && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required={!editing} placeholder="Min 6 characters" minLength={6} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input className="form-input" value={form.contactNumber} onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value }))} placeholder="10-digit phone" />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Student"
        message="Are you sure you want to delete this student? Their exam history will also be removed."
      />
    </div>
  );
}
