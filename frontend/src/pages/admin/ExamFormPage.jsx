import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { EXAMS, GROUPS } from '../../api/endpoints';
import Button from '../../components/ui/Button';
import { ArrowLeft, Plus, Trash2, Save, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyQ = { question: '', options: { A: '', B: '', C: '', D: '' }, correctAnswer: 'A', marks: 1, difficulty: 'medium', explanation: '' };

export default function ExamFormPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', instructions: '', date: '', startTime: '09:00', duration: 60,
    passMark: 40, category: 'Quiz', questions: [{ ...emptyQ }],
    settings: { shuffleQuestions: false, shuffleOptions: false, enableFullScreen: true,
      enableTabSwitchDetection: true, autoSubmitViolations: true, maxViolations: 3,
      showResultImmediately: false, negativeMarking: 0 },
  });

  useEffect(() => {
    api.get(GROUPS.LIST).then(r => setGroups(r.data.data || r.data.groups || [])).catch(() => {});
  }, []);

  const updateQ = (i, field, value) => {
    const qs = [...form.questions];
    if (field.startsWith('options.')) {
      qs[i] = { ...qs[i], options: { ...qs[i].options, [field.split('.')[1]]: value } };
    } else {
      qs[i] = { ...qs[i], [field]: value };
    }
    setForm(p => ({ ...p, questions: qs }));
  };

  const addQ = () => setForm(p => ({ ...p, questions: [...p.questions, { ...emptyQ }] }));
  const removeQ = (i) => {
    if (form.questions.length <= 1) return toast.error('At least 1 question required');
    setForm(p => ({ ...p, questions: p.questions.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.startTime) return toast.error('Fill required fields');
    if (form.questions.some(q => !q.question || !q.options.A)) return toast.error('Complete all questions');
    setSaving(true);
    try {
      const totalMarks = form.questions.reduce((s, q) => s + Number(q.marks), 0);
      await api.post(EXAMS.CREATE, { ...form, totalMarks });
      toast.success('Exam created!');
      navigate('/admin/exams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally { setSaving(false); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-md">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/exams')} />
          <div><h1 className="page-title">Create Exam</h1>
            <p className="page-subtitle">Step {step} of 3</p></div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-sm" style={{ marginBottom: 'var(--space-xl)' }}>
        {['Basic Info', 'Questions', 'Settings'].map((s, i) => (
          <button key={i} onClick={() => setStep(i + 1)} style={{
            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center',
            fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.2s',
            background: step === i + 1 ? 'linear-gradient(135deg,var(--accent-blue),#6366f1)' : 'var(--bg-glass)',
            color: step === i + 1 ? 'white' : 'var(--text-secondary)',
            border: `1px solid ${step === i + 1 ? 'transparent' : 'var(--border-color)'}`,
          }}>{i + 1}. {s}</button>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="glass-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Exam Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Mid-Term Mathematics" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input className="form-input" type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (min) *</label>
                <input className="form-input" type="number" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: +e.target.value }))} min={1} />
              </div>
              <div className="form-group">
                <label className="form-label">Pass Mark *</label>
                <input className="form-input" type="number" value={form.passMark} onChange={e => setForm(p => ({ ...p, passMark: +e.target.value }))} min={0} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {['Mid Term', 'Final Term', 'Quiz', 'Assignment', 'Practice'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Button onClick={() => setStep(2)} style={{ alignSelf: 'flex-end' }}>Next: Questions →</Button>
          </div>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {form.questions.map((q, i) => (
            <div key={i} className="glass-card">
              <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 700 }}>Question {i + 1}</h4>
                <Button variant="ghost" size="sm" icon={Trash2} onClick={() => removeQ(i)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <textarea className="form-textarea" value={q.question} onChange={e => updateQ(i, 'question', e.target.value)} placeholder="Enter question..." rows={2} />
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Option A *</label><input className="form-input" value={q.options.A} onChange={e => updateQ(i, 'options.A', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Option B *</label><input className="form-input" value={q.options.B} onChange={e => updateQ(i, 'options.B', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Option C *</label><input className="form-input" value={q.options.C} onChange={e => updateQ(i, 'options.C', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Option D *</label><input className="form-input" value={q.options.D} onChange={e => updateQ(i, 'options.D', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Correct Answer</label>
                    <select className="form-select" value={q.correctAnswer} onChange={e => updateQ(i, 'correctAnswer', e.target.value)}>
                      {['A','B','C','D'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Marks</label>
                    <input className="form-input" type="number" value={q.marks} onChange={e => updateQ(i, 'marks', +e.target.value)} min={0} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button variant="secondary" icon={Plus} onClick={addQ} fullWidth>Add Question</Button>
          <div className="flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={() => setStep(3)}>Next: Settings →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <div className="glass-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              ['shuffleQuestions', 'Shuffle Questions'],
              ['shuffleOptions', 'Shuffle Options'],
              ['enableFullScreen', 'Enable Full Screen'],
              ['enableTabSwitchDetection', 'Tab Switch Detection'],
              ['autoSubmitViolations', 'Auto-Submit on Max Violations'],
              ['showResultImmediately', 'Show Result Immediately'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                <input type="checkbox" checked={form.settings[key]} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, [key]: e.target.checked } }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-blue)' }} />
              </label>
            ))}
            <div className="form-row">
              <div className="form-group"><label className="form-label">Max Violations</label>
                <input className="form-input" type="number" value={form.settings.maxViolations} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, maxViolations: +e.target.value } }))} min={1} max={10} />
              </div>
              <div className="form-group"><label className="form-label">Negative Marking (%)</label>
                <input className="form-input" type="number" value={form.settings.negativeMarking} onChange={e => setForm(p => ({ ...p, settings: { ...p.settings, negativeMarking: +e.target.value } }))} min={0} max={100} />
              </div>
            </div>
            <div className="flex justify-between" style={{ marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button icon={Save} onClick={handleSubmit} loading={saving}>Create Exam</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
