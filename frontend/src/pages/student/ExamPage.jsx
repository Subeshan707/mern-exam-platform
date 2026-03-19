import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { EXAMS } from '../../api/endpoints';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Clock, ChevronLeft, ChevronRight, Flag, Send, AlertTriangle, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';
import './ExamPage.css';

export default function ExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [setupStep, setSetupStep] = useState('fetching'); // fetching -> permissions -> starting -> taking
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [maxViolations, setMaxViolations] = useState(3);
  const [mediaStream, setMediaStream] = useState(null);
  
  const timerRef = useRef(null);
  const lastViolationRef = useRef({});
  const autoSubmittingRef = useRef(false);

  useEffect(() => {
    const fetchExamPrep = async () => {
      try {
        const res = await api.get(EXAMS.DETAIL(id));
        const examData = res.data?.data || res.data;
        setExam(examData);
        
        if (examData.settings?.requireScreenShare) {
          setSetupStep('permissions');
        } else {
          executeStartExam(examData);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load exam details');
        navigate('/student/exams');
      }
    };
    fetchExamPrep();
  }, [id, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const executeStartExam = async (examDataObj) => {
    setSetupStep('starting');
    try {
      const res = await api.post(EXAMS.START(id));
      const data = res.data.data || res.data;
      const normalizedAttempt = {
        ...(data.attempt || {}),
        _id: data.attempt?._id || data.attempt?.id,
      };

      setExam(data.exam || examDataObj);
      setAttempt(normalizedAttempt);
      setViolationCount(Number(normalizedAttempt?.violations || 0));
      setMaxViolations(Number((data.exam || examDataObj)?.settings?.maxViolations || 3));
      const qs = (data.exam || examDataObj)?.questions || [];
      setAnswers(qs.map(q => ({ questionId: q._id, selectedOption: null, isVisited: false, isMarkedForReview: false })));
      setTimeLeft(((data.exam || examDataObj)?.duration || 60) * 60);
      if (socket && normalizedAttempt?._id) socket.emit('join-exam', id, normalizedAttempt._id);
      
      setSetupStep('taking');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start exam');
      navigate('/student/exams');
    }
  };

  const handleRequestScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { displaySurface: 'monitor', logicalSurface: true },
        audio: false 
      });
      setMediaStream(stream);
      executeStartExam(exam);
    } catch (err) {
      toast.error('You must share your screen to take this exam.');
    }
  };

  const getAttemptId = () => attempt?._id || attempt?.id;

  const cleanupStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
    }
  }, [mediaStream]);

  const handleAutoSubmit = useCallback(async (showToast = true) => {
    if (autoSubmittingRef.current) return;
    autoSubmittingRef.current = true;
    cleanupStream();

    try {
      const attemptId = getAttemptId();
      await api.post(EXAMS.AUTO_SUBMIT(attemptId), { answers });
      if (showToast) {
        toast('Time is up! Exam auto-submitted.', { icon: '⏱️' });
      }
      navigate('/student/results');
    } catch {
      toast.error('Auto-submit failed. Please submit manually if possible.');
    }
  }, [attempt, answers, navigate, cleanupStream]);

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

  // Bind screen share stop listener to fresh reportViolation closure
  useEffect(() => {
    if (mediaStream && attempt) {
      const track = mediaStream.getVideoTracks()[0];
      const handleStop = () => {
        toast.error('Screen sharing was stopped! Violation recorded.');
        reportViolation('screen-share-stopped', 'Student stopped screen sharing via browser controls');
      };
      track.addEventListener('ended', handleStop);
      return () => track.removeEventListener('ended', handleStop);
    }
  }, [mediaStream, attempt, reportViolation]);

  useEffect(() => {
    return () => cleanupStream();
  }, [cleanupStream]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || setupStep !== 'taking') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleAutoSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [setupStep, handleAutoSubmit]); // Removed timeLeft dependency to avoid reset bugs

  const formatTime = (s) => {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const selectOption = (opt) => {
    const a = [...answers];
    a[currentQ] = { ...a[currentQ], selectedOption: opt, isVisited: true };
    setAnswers(a);
    // Auto-save
    if (socket && attempt) socket.emit('auto-save', { attemptId: getAttemptId(), answers: a });
  };

  const markForReview = () => {
    const a = [...answers];
    a[currentQ] = { ...a[currentQ], isMarkedForReview: !a[currentQ].isMarkedForReview, isVisited: true };
    setAnswers(a);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    cleanupStream();
    try {
      const attemptId = getAttemptId();
      await api.post(EXAMS.SUBMIT(attemptId), { answers });
      toast.success('Exam submitted!');
      navigate('/student/results');
    } catch (err) { toast.error(err.response?.data?.message || 'Submit failed'); }
    finally { setSubmitting(false); setSubmitOpen(false); }
  };

  useEffect(() => {
    if (setupStep !== 'taking' || !attempt || !exam) return;

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
  }, [setupStep, attempt, exam, reportViolation]);

  if (setupStep === 'fetching' || setupStep === 'starting') return <LoadingSpinner text="Preparing exam environment..." />;
  
  if (setupStep === 'permissions') {
    return (
      <div className="page-container flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <div className="glass-card" style={{ maxWidth: '480px', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#3b82f6' }}>
            <MonitorPlay size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Screen Share Required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            This is a securely proctored exam. You are required to share your entire screen before starting. If you stop sharing during the exam, an anti-cheat violation will be automatically recorded.
          </p>
          <Button fullWidth onClick={handleRequestScreenShare} size="lg">Share Screen & Start Exam</Button>
          <Button fullWidth variant="ghost" onClick={() => navigate('/student/exams')} style={{ marginTop: '1rem' }}>Cancel & Go Back</Button>
        </div>
      </div>
    );
  }

  if (!exam || setupStep !== 'taking') return null;

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
