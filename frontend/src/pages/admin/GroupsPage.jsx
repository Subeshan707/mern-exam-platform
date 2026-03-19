import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { GROUPS } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import SearchInput from '../../components/ui/SearchInput';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, Users, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '2023', '2024', '2025', '2026'];
const BATCHES = ['Batch A', 'Batch B', 'Batch C', 'Batch D', 'Morning', 'Evening'];
const SECTIONS = ['Section A', 'Section B', 'Section C', 'Section D', 'Section E'];
const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'OTHER'];

const emptyForm = { name: '', year: '1st Year', batch: 'Batch A', section: 'Section A', department: 'CSE', description: '' };

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get(GROUPS.LIST);
      setGroups(res.data.data || res.data.groups || []);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(GROUPS.UPDATE(editing), form);
        toast.success('Group updated!');
      } else {
        await api.post(GROUPS.CREATE, form);
        toast.success('Group created!');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (group) => {
    setEditing(group._id);
    setForm({
      name: group.name, year: group.year, batch: group.batch,
      section: group.section, department: group.department || 'CSE',
      description: group.description || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(GROUPS.DELETE(deleteId));
      toast.success('Group deleted!');
      setDeleteId(null);
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete group');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading groups..." />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-subtitle">Manage student groups and sections</p>
        </div>
        <div className="page-actions">
          <SearchInput placeholder="Search groups..." onSearch={setSearch} />
          <Button icon={Plus} onClick={() => { setEditing(null); setForm(emptyForm); setModalOpen(true); }}>
            Add Group
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No groups found"
          message="Create your first group to organize students."
          action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Create Group</Button>}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Department</th>
                <th>Year</th>
                <th>Batch</th>
                <th>Section</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(group => (
                <tr key={group._id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))',
                        padding: '0.375rem', borderRadius: 'var(--radius-sm)',
                      }}>
                        <Building size={14} style={{ color: 'var(--accent-blue)' }} />
                      </div>
                      {group.name}
                    </div>
                  </td>
                  <td><Badge variant="info">{group.department || '-'}</Badge></td>
                  <td>{group.year}</td>
                  <td>{group.batch}</td>
                  <td>{group.section}</td>
                  <td>{group.studentCount ?? 0}</td>
                  <td><Badge variant={group.isActive ? 'success' : 'danger'} dot>{group.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <Button variant="ghost" size="sm" icon={Edit2} onClick={() => handleEdit(group)} />
                      <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setDeleteId(group._id)} />
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
        title={editing ? 'Edit Group' : 'Create Group'} size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Group Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. CS 3rd Year A" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-select" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year *</label>
                <select className="form-select" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Batch *</label>
                <select className="form-select" value={form.batch} onChange={e => setForm(p => ({ ...p, batch: e.target.value }))}>
                  {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section *</label>
                <select className="form-select" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))}>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description..." rows={2} />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Group"
        message="Are you sure you want to delete this group? All students in this group will need to be reassigned."
      />
    </div>
  );
}
