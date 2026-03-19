import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import { User, Mail, Phone, MapPin, Hash, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { AUTH } from '../../api/endpoints';

export default function ProfilePage() {
  const { user } = useAuth();
  const [changingPw, setChangingPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(AUTH.CHANGE_PASSWORD, pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
      setChangingPw(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Your account information</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)', maxWidth: 800 }}>
        {/* Avatar card */}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, var(--accent-blue), #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 800, color: 'white',
          }}>
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{user?.name || 'Student'}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.rollNumber || ''}</p>
          {user?.group && <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>{user.group.name}</p>}
        </div>

        {/* Info */}
        <div className="glass-card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-md)' }}>Account Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: User, label: 'Full Name', value: user?.name },
              { icon: Hash, label: 'Roll Number', value: user?.rollNumber },
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Contact', value: user?.contactNumber || 'Not set' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-md" style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                <f.icon size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.label}</p>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.value || '-'}</p></div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-lg)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
            {!changingPw ? (
              <Button variant="secondary" onClick={() => setChangingPw(true)}>Change Password</Button>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input className="form-input" type="password" placeholder="Current password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
                <input className="form-input" type="password" placeholder="New password (min 6 chars)" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required minLength={6} />
                <div className="flex gap-sm">
                  <Button variant="secondary" onClick={() => setChangingPw(false)}>Cancel</Button>
                  <Button type="submit" icon={Save} loading={saving}>Update</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
