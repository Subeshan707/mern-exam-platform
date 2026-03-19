import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { EXAMS } from '../../api/endpoints';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import './ExamPage.css';

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const timerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const lastViolationRef = useRef({});
  const autoSubmittingRef = useRef(false);

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      startExam();
    }

    return () => clearInterval(timerRef.current);
  }, []);

  const startExam = async () => {
    try {
      const res = await api.post(EXAMS.START(id));
      const data = res.data.data || res.data;
      const normalizedAttempt = {
        ...(data.attempt || {}),
        _id: data.attempt?._id || data.attempt?.id,
      };

      setExam(data.exam);
      setAttempt(normalizedAttempt);
      setViolationCount(Number(normalizedAttempt?.violations || 0));
      setMaxViolations(Number(data.exam?.settings?.maxViolations || 3));
      const qs = data.exam?.questions || [];
      setAnswers(qs.map(q => ({ questionId: q._id, selectedOption: null, isVisited: false, isMarkedForReview: false })));
      setTimeLeft((data.exam?.duration || 60) * 60);
      if (socket && normalizedAttempt?._id) socket.emit('join-exam', id, normalizedAttempt._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start exam');
      navigate('/student/exams');
    }
    finally { setLoading(false); }
  };

  const getAttemptId = () => attempt?._id || attempt?.id;

  const handleAutoSubmit = useCallback(async (showToast = true) => {
    if (autoSubmittingRef.current) return;
    autoSubmittingRef.current = true;

    try {
      const attemptId = getAttemptId();
      await api.post(EXAMS.AUTO_SUBMIT(attemptId), { answers });
      if (showToast) {
        toast('Time is up! Exam auto-submitted.', { icon: '⏰' });
      }
      navigate('/student/results');
    } catch {
      toast.error('Auto-submit failed. Please submit manually if possible.');
    }
  }, [attempt, answers, navigate]);

  const reportViolation = useCallback(async (type, details) => {
    if (!attempt || !exam) return;

    const now = Date.now();
    const lastAt = lastViolationRef.current[type] || 0;
    // Ignore burst duplicate events for same violation type.
    if (now - lastAt < 1500) return;
    lastViolationRef.current[type] = now;

    try {
      const attemptId = getAttemptId();
      const res = await api.post(EXAMS.VIOLATION(attemptId), { type, details });
      const data = res.data?.data || {};

      const current = Number(data.violationCount || 0);
      const max = Number(data.maxViolations || exam?.settings?.maxViolations || 3);

      setViolationCount(current);
      setMaxViolations(max);

      const remaining = Math.max(0, max - current);
      if (remaining > 0) {
        toast.error(`Violation recorded (${current}/${max}). Remaining: ${remaining}`);
      }

      if (data.shouldAutoSubmit) {
        toast.error('Violation limit reached. Auto-submitting exam.');
        await handleAutoSubmit(false);
      }
    } catch {
      // Ignore logging errors to keep exam flow uninterrupted.
    }
  }, [attempt, exam, handleAutoSubmit]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleAutoSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [attempt, handleAutoSubmit]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const selectOption = (opt) => {
    const a = [...answers];
    a[currentQ] = { ...a[currentQ], selectedOption: opt, isVisited: true };
    setAnswers(a);
    // Auto-save
    if (socket && attempt) socket.emit('auto-save', { attemptId: attempt._id, answers: a });
  };

  const markForReview = () => {
    const a = [...answers];
    a[currentQ] = { ...a[currentQ], isMarkedForReview: !a[currentQ].isMarkedForReview, isVisited: true };
    setAnswers(a);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const attemptId = attempt?._id || attempt?.id;
      await api.post(EXAMS.SUBMIT(attemptId), { answers });
      toast.success('Exam submitted!');
      navigate('/student/results');
    } catch (err) { toast.error(err.response?.data?.message || 'Submit failed'); }
    finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (!attempt || !exam) return;

    const settings = exam.settings || {};

    const requestFullScreen = async () => {
      if (!settings.enableFullScreen) return;
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        toast.error('Fullscreen is required for this exam.');
      }
    };

    const onVisibilityChange = () => {
      if (settings.enableTabSwitchDetection && document.hidden) {
        reportViolation('tab-switch', 'Tab switched or page hidden');
      }
    };

    const onWindowBlur = () => {
      if (settings.enableTabSwitchDetection) {
        reportViolation('browser-minimize', 'Window lost focus');
      }
    };

    const onFullScreenChange = () => {
      if (settings.enableFullScreen && !document.fullscreenElement) {
        reportViolation('fullscreen-exit', 'Fullscreen mode exited');
      }
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      reportViolation('right-click', 'Right-click attempt blocked');
    };

    const onClipboardEvent = (e) => {
      e.preventDefault();
      reportViolation('copy-attempt', `${e.type} blocked`);
    };

    const onKeyDown = (e) => {
      const key = (e.key || '').toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const blockedCombo = ctrlOrCmd && ['c', 'v', 'x', 'a', 'p', 's', 'u'].includes(key);
      const blockedDevtools = key === 'f12' || (ctrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(key));

      if (blockedCombo || blockedDevtools) {
        e.preventDefault();
        reportViolation('copy-attempt', `Blocked keyboard shortcut: ${e.key}`);
      }
    };

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      reportViolation('navigation-away', 'Attempted to close or reload exam page');
    };

    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
      reportViolation('navigation-away', 'Attempted to navigate back from exam');
    };

    requestFullScreen();
    window.history.pushState(null, '', window.location.href);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('fullscreenchange', onFullScreenChange);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onClipboardEvent);
    document.addEventListener('cut', onClipboardEvent);
    document.addEventListener('paste', onClipboardEvent);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('fullscreenchange', onFullScreenChange);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onClipboardEvent);
      document.removeEventListener('cut', onClipboardEvent);
      document.removeEventListener('paste', onClipboardEvent);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, [attempt, exam, reportViolation]);

  if (loading) return <LoadingSpinner text="Loading exam..." />;
  if (!exam) return null;

  const questions = exam.questions || [];
  const q = questions[currentQ];
  const answered = answers.filter(a => a.selectedOption).length;
  const reviewed = answers.filter(a => a.isMarkedForReview).length;

  return (
    <div className="exam-page strict-mode">
      {/* Header */}
      <header className="exam-header">
        <h2 className="exam-title">{exam.name}</h2>
        <div className="exam-header-right">
          <div className="exam-proctor-status">
            <AlertTriangle size={14} />
            <span>Violations: {violationCount}/{maxViolations}</span>
          </div>
          <div className={`exam-timer ${timeLeft < 300 ? 'danger' : ''}`}>
            <Clock size={16} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <div className="exam-body">
        {/* Question area */}
        <div className="exam-question-area">
          <div className="question-header">
            <span className="question-number">Question {currentQ + 1} of {questions.length}</span>
            <button className={`review-btn ${answers[currentQ]?.isMarkedForReview ? 'active' : ''}`} onClick={markForReview}>
              <Flag size={14} /> {answers[currentQ]?.isMarkedForReview ? 'Marked' : 'Mark for Review'}
            </button>
          </div>

          <div className="question-text">{q?.question}</div>

          <div className="options-grid">
            {['A', 'B', 'C', 'D'].map(opt => (
              <button key={opt} className={`option-btn ${answers[currentQ]?.selectedOption === opt ? 'selected' : ''}`}
                onClick={() => selectOption(opt)}>
                <span className="option-letter">{opt}</span>
                <span className="option-text">{q?.options?.[opt]}</span>
              </button>
            ))}
          </div>

          <div className="question-nav">
            <Button variant="secondary" icon={ChevronLeft} disabled={currentQ === 0} onClick={() => { setCurrentQ(c => c - 1); const a = [...answers]; a[currentQ] = { ...a[currentQ], isVisited: true }; setAnswers(a); }}>Prev</Button>
            {currentQ < questions.length - 1 ? (
              <Button icon={ChevronRight} onClick={() => { const a = [...answers]; a[currentQ] = { ...a[currentQ], isVisited: true }; setAnswers(a); setCurrentQ(c => c + 1); }}>Next</Button>
            ) : (
              <Button variant="success" icon={Send} onClick={() => setSubmitOpen(true)}>Submit</Button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="exam-sidebar">
          <div className="sidebar-stats">
            <div className="stat"><span className="stat-val">{answered}</span><span className="stat-lbl">Answered</span></div>
            <div className="stat"><span className="stat-val">{questions.length - answered}</span><span className="stat-lbl">Remaining</span></div>
            <div className="stat"><span className="stat-val">{reviewed}</span><span className="stat-lbl">Reviewed</span></div>
          </div>
          <div className="question-grid">
            {questions.map((_, i) => (
              <button key={i} className={`q-btn ${currentQ === i ? 'current' : ''} ${answers[i]?.selectedOption ? 'answered' : ''} ${answers[i]?.isMarkedForReview ? 'reviewed' : ''} ${answers[i]?.isVisited && !answers[i]?.selectedOption ? 'visited' : ''}`}
                onClick={() => setCurrentQ(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <Button variant="success" icon={Send} fullWidth onClick={() => setSubmitOpen(true)} style={{ marginTop: '1rem' }}>Submit Exam</Button>
        </aside>
      </div>

      <ConfirmDialog isOpen={submitOpen} onClose={() => setSubmitOpen(false)} onConfirm={handleSubmit}
        loading={submitting} title="Submit Exam" variant="success"
        message={`You have answered ${answered} out of ${questions.length} questions. Are you sure you want to submit?`} />
    </div>
  );
}
