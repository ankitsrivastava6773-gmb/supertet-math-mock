'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

import {
  loadProfile,
  saveProfile,
  createDefaultProfile,
  clearProfile,
  updateProfileAfterAnswer,
  computeTopicWeakness,
  computeTopicWeights,
  exportProfileToFile,
  importProfileFromJSON
} from './lib/profile';

import {
  createAdaptiveSessionState,
  processAdaptiveAnswer,
  selectQuestionWithFallback
} from './lib/adaptiveEngine';

// Topic metadata covering full SuperTET 18-Topic Syllabus (672 verified questions)
const TOPICS = [
  { id: 'T01', name_hi: 'संख्याएँ, भाजक एवं कैलेंडर (Numbers & Primes)', name_en: 'Numbers, Divisors & Calendar', icon: '🔢', count: 57 },
  { id: 'T02', name_hi: 'दशमलव एवं आवर्त भिन्न (Decimals)', name_en: 'Decimals & Recurring Fractions', icon: '🔣', count: 27 },
  { id: 'T03', name_hi: 'विभाज्यता के नियम (Divisibility)', name_en: 'Divisibility Rules', icon: '🔍', count: 23 },
  { id: 'T04', name_hi: 'भिन्न एवं स्थानीय मान (Fractions & Place Value)', name_en: 'Fractions & Place Value', icon: '🍰', count: 35 },
  { id: 'T05', name_hi: 'लघुत्तम समापवर्त्य एवं घंटियाँ (LCM, HCF & Bells)', name_en: 'LCM, HCF & Periodic Bells', icon: '⚙️', count: 25 },
  { id: 'T06', name_hi: 'सरलीकरण एवं कोष्ठक (BODMAS)', name_en: 'BODMAS & Simplification', icon: '🧮', count: 25 },
  { id: 'T08', name_hi: 'ऐकिक नियम एवं कार्य-समय (Work & Time / Chain Rule)', name_en: 'Work-Time & Chain Rule', icon: '⏳', count: 22 },
  { id: 'T09', name_hi: 'प्रतिशतता एवं खपत (Percentage)', name_en: 'Percentage & Consumption', icon: '📈', count: 27 },
  { id: 'T10', name_hi: 'लाभ, हानि एवं बट्टा (Commercial Math)', name_en: 'Profit, Loss & Discount', icon: '💰', count: 39 },
  { id: 'T11', name_hi: 'साधारण एवं चक्रवृद्धि ब्याज (SI, CI & Multiplier)', name_en: 'Simple & Compound Interest', icon: '🏦', count: 61 },
  { id: 'T12', name_hi: 'अनुपात एवं समानुपात (Ratio & Proportion)', name_en: 'Ratio & Proportion', icon: '⚖️', count: 25 },
  { id: 'T13', name_hi: 'औसत एवं प्रतिस्थापन (Average Shift)', name_en: 'Average & Replacement', icon: '🎯', count: 25 },
  { id: 'T14', name_hi: 'ज्यामिति एवं वृत्त स्पर्श रेखाएँ (Geometry & Figures)', name_en: 'Geometry, Circles & Figures', icon: '📐', count: 78 },
  { id: 'T15', name_hi: '2D क्षेत्रमिति एवं समचतुर्भुज (Mensuration 2D)', name_en: '2D Mensuration & Rhombus', icon: '🟩', count: 59 },
  { id: 'T16', name_hi: 'बीजगणितीय सर्वसमिकाएँ (Identities)', name_en: 'Algebraic Identities', icon: '✨', count: 33 },
  { id: 'T17', name_hi: 'बीजगणित, घातांक एवं समीकरण (Algebra & Equations)', name_en: 'Algebra, Indices & Equations', icon: '⚡', count: 37 },
  { id: 'T18', name_hi: '3D क्षेत्रमिति एवं घन कर्तन (3D Mensuration & Cubes)', name_en: '3D Mensuration & Cubes', icon: '🧊', count: 27 },
  { id: 'T19', name_hi: 'सांख्यिकी एवं पाई चार्ट (Statistics & Pie Chart)', name_en: 'Statistics & Pie Chart', icon: '📊', count: 46 }
];

export default function MathMockApp() {
  // App State
  const [lang, setLang] = useState('hi'); // 'hi' or 'en'
  const [view, setView] = useState('home'); // 'home' | 'test' | 'result' | 'weakness'
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('T10');
  
  // Persistent Profile & Mastery
  const [profile, setProfile] = useState(null);

  // Test State
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: chosenLabel }
  const [timeRemaining, setTimeRemaining] = useState(1500); // 25 mins for 16 Qs
  const [timerActive, setTimerActive] = useState(false);
  const [testConfig, setTestConfig] = useState({ mode: 'mock', count: 16, timeLimit: 1500 });
  const [testResult, setTestResult] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'wrong' | 'correct' | 'skipped'
  const [history, setHistory] = useState([]);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Adaptive Session State
  const [adaptiveState, setAdaptiveState] = useState(null);
  const fileInputRef = useRef(null);

  // Load history & profile on mount
  useEffect(() => {
    try {
      const p = loadProfile();
      setProfile(p);

      const saved = localStorage.getItem('supertet_math_mock_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Storage error', e);
    }

    // Register Service Worker for PWA
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(e => console.warn('SW reg error', e));
    }

    // Listen for PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(lang === 'hi' ? 'फोन स्क्रीन पर ऐप जोड़ने के लिए ब्राउज़र मेनू (⋮) से "Add to Home Screen" या "ऐप इंस्टॉल करें" चुनें।' : 'To install, open browser menu (⋮) and tap "Add to Home Screen".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Timer logic
  useEffect(() => {
    let timer = null;
    if (timerActive && timeRemaining > 0 && view === 'test') {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitTestAuto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, timeRemaining, view]);

  // Start a new test session
  const startTest = async (mode = 'mock', count = 16, timeLimit = 1500, topicId = null) => {
    setLoading(true);
    try {
      let url = `/api/questions?mode=${mode}&count=${count}`;
      if (topicId) url += `&topic_id=${topicId}`;

      // Pass weakness topic weights if available in profile
      if (profile && (mode === 'mock' || mode === 'adaptive')) {
        const allTopicIds = TOPICS.map(t => t.id);
        const weights = computeTopicWeights(profile, allTopicIds);
        const weightParam = Object.entries(weights).map(([k, v]) => `${k}:${v}`).join(',');
        url += `&topic_weights=${encodeURIComponent(weightParam)}`;
      }

      // If user has seen recent IDs, exclude them
      if (profile?.seen_ids?.length > 0) {
        const excludeParam = profile.seen_ids.slice(-50).join(',');
        url += `&exclude=${encodeURIComponent(excludeParam)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIdx(0);
        setAnswers({});
        setTestConfig({ mode, count: data.questions.length, timeLimit, topicId });
        setTimeRemaining(timeLimit);
        setTimerActive(timeLimit > 0);

        if (mode === 'adaptive') {
          setAdaptiveState(createAdaptiveSessionState('Easy'));
        } else {
          setAdaptiveState(null);
        }

        setView('test');
      } else {
        alert(lang === 'hi' ? 'प्रश्न लोड करने में त्रुटि आई।' : 'Failed to load questions.');
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching questions');
    } finally {
      setLoading(false);
    }
  };

  // Option selection
  const selectOption = (qId, label) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: label
    }));

    // In Adaptive Mode, record transition in adaptive state
    if (testConfig.mode === 'adaptive' && adaptiveState) {
      const q = questions[currentIdx];
      const nextAdaptive = processAdaptiveAnswer(adaptiveState, q, label);
      setAdaptiveState(nextAdaptive);
    }

    // Immediately update profile for real-time mastery tracking
    const q = questions[currentIdx];
    if (profile && q) {
      const updated = updateProfileAfterAnswer(profile, q, label);
      setProfile({ ...updated });
      saveProfile(updated);
    }
  };

  // Clear answer
  const clearOption = (qId) => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  // Auto submit when time runs out
  const submitTestAuto = () => {
    alert(lang === 'hi' ? 'समय समाप्त हो गया है! आपका टेस्ट स्वतः सबमिट किया जा रहा है।' : 'Time has expired! Submitting test automatically.');
    finalizeTest();
  };

  // Finalize test scoring
  const finalizeTest = () => {
    setTimerActive(false);

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let marksEarned = 0;
    const topicStats = {};
    const misconceptionsEncountered = [];

    let currentProf = profile || loadProfile();

    questions.forEach((q, idx) => {
      const chosen = answers[q.id];
      const tId = q.topic_id;

      if (!topicStats[tId]) {
        topicStats[tId] = {
          name_hi: q.topic_meta?.name_hi || tId,
          name_en: q.topic_meta?.name_en || tId,
          total: 0,
          correct: 0,
          wrong: 0,
          skipped: 0
        };
      }
      topicStats[tId].total += 1;

      // Update profile
      currentProf = updateProfileAfterAnswer(currentProf, q, chosen || null);

      if (!chosen) {
        skippedCount += 1;
        topicStats[tId].skipped += 1;
      } else if (chosen === q.correct_label) {
        correctCount += 1;
        marksEarned += 3;
        topicStats[tId].correct += 1;
      } else {
        wrongCount += 1;
        marksEarned -= 1;
        topicStats[tId].wrong += 1;

        // Misconception identification
        const chosenOpt = q.options.find(opt => opt.label === chosen);
        if (chosenOpt && chosenOpt.misconception_info) {
          misconceptionsEncountered.push({
            qId: q.id,
            topic: q.topic_meta?.name_hi || tId,
            chosenOption: chosen,
            correctOption: q.correct_label,
            ...chosenOpt.misconception_info
          });
        }
      }
    });

    setProfile({ ...currentProf });
    saveProfile(currentProf);

    const totalQuestions = questions.length;
    const maxMarks = totalQuestions * 3;
    const attemptedCount = correctCount + wrongCount;
    const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : '0';
    const timeSpent = testConfig.timeLimit > 0 ? (testConfig.timeLimit - timeRemaining) : 0;
    const avgTimePerQ = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

    const result = {
      date: new Date().toLocaleDateString('hi-IN'),
      mode: testConfig.mode,
      totalQuestions,
      maxMarks,
      marksEarned,
      correctCount,
      wrongCount,
      skippedCount,
      negativeLoss: wrongCount, // each wrong loses 1 mark from pool
      accuracy,
      timeSpentSec: timeSpent,
      avgTimePerQ,
      topicStats,
      misconceptionsEncountered,
      adaptiveState: adaptiveState ? { ...adaptiveState } : null
    };

    setTestResult(result);
    setView('result');

    // Save to localStorage history
    try {
      const newHistory = [result, ...history].slice(0, 15);
      setHistory(newHistory);
      localStorage.setItem('supertet_math_mock_history', JSON.stringify(newHistory));
    } catch (e) {
      console.warn('Could not save history', e);
    }
  };

  // Helper formatting mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Profile JSON import handler
  const handleImportProfile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = importProfileFromJSON(event.target.result);
        setProfile(imported);
        alert(lang === 'hi' ? '✅ प्रोफ़ाइल सफलतापूर्वक आयात (Import) हो गई!' : '✅ Profile imported successfully!');
      } catch (err) {
        alert(lang === 'hi' ? '❌ अमान्य प्रोफ़ाइल फ़ाइल।' : '❌ Invalid profile JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Reset all test history, progress percentages, and mastery profile (Protected: 311024)
  const handleResetAllData = () => {
    const inputPin = window.prompt(
      lang === 'hi'
        ? '🔒 सुरक्षा कोड दर्ज करें:\n\nसारा टेस्ट डेटा, इतिहास व अध्याय महारत रीसेट करने के लिए पासवर्ड (PIN) दर्ज करें:'
        : '🔒 Security Verification:\n\nEnter password (PIN) to reset all test history and mastery data:'
    );

    if (inputPin === null) {
      // User cancelled
      return;
    }

    if (inputPin.trim() !== '311024') {
      alert(
        lang === 'hi'
          ? '❌ गलत पासवर्ड! डेटा रीसेट नहीं किया गया। आपका रिकॉर्ड पूर्णतः सुरक्षित है।'
          : '❌ Incorrect password! Reset cancelled. Your records remain safe.'
      );
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('supertet_math_mock_history');
        window.localStorage.removeItem('supertet_math_profile_v1');
      }
      setHistory([]);
      setProfile(createDefaultProfile());
      setAnswers({});
      setTestResult(null);
      alert(
        lang === 'hi'
          ? '✅ पासवर्ड सत्यापित! सारा टेस्ट इतिहास एवं प्रोफ़ाइल डेटा सफलतापूर्वक शून्य (Reset) कर दिया गया है।'
          : '✅ Password verified! All test history and profile data has been successfully reset.'
      );
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const currQ = questions[currentIdx];

  // Render difficulty chip helper
  const renderDifficultyChip = (diff) => {
    if (diff === 'Easy') {
      return (
        <span className={styles.diffChipEasy}>
          🟢 {lang === 'hi' ? 'आसान (स्तर 1)' : 'Easy (Lvl 1)'}
        </span>
      );
    }
    if (diff === 'Hard') {
      return (
        <span className={styles.diffChipHard}>
          🔴 {lang === 'hi' ? 'कठिन (स्तर 3)' : 'Hard (Lvl 3)'}
        </span>
      );
    }
    return (
      <span className={styles.diffChipMed}>
        🟡 {lang === 'hi' ? 'मध्यम (स्तर 2)' : 'Medium (Lvl 2)'}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {/* Global Navbar */}
      <header className={`${styles.navbar} glass-panel`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>📐</div>
          <div>
            <div className={styles.brandTitle}>
              SuperTET <span className="gradient-text">Math 2026</span>
              <span className="badge badge-primary">Adaptive Engine</span>
            </div>
            <div className={styles.brandSubtitle}>
              {lang === 'hi' ? 'उत्तर प्रदेश 2026 प्राथमिक शिक्षक भर्ती (16 प्रश्न / 48 अंक)' : 'UP 2026 Primary Teacher Math Simulator (16 Qs / 48 Marks)'}
            </div>
          </div>
        </div>

        <div className={styles.navControls}>
          {view !== 'home' && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                if (view === 'test' && !confirm(lang === 'hi' ? 'क्या आप टेस्ट छोड़कर होम स्क्रीन पर जाना चाहते हैं?' : 'Exit test and return home?')) return;
                setView('home');
              }}
            >
              🏠 {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </button>
          )}

          {/* Weakness & Mastery Hub */}
          <button 
            className={`btn ${view === 'weakness' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setView('weakness')}
          >
            🎯 {lang === 'hi' ? 'मेरी कमज़ोरियाँ व महारत' : 'Weak Spots & Mastery'}
          </button>

          {/* Printable Offline Paper Link */}
          <Link href="/print" target="_blank" style={{ textDecoration: 'none' }}>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🖨️ {lang === 'hi' ? 'ऑफलाइन PDF' : 'Print PDF'}
            </button>
          </Link>

          {/* PWA Install Button */}
          {isInstallable && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleInstallClick}
            >
              📲 {lang === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App'}
            </button>
          )}

          {/* Data Reset Button */}
          <button 
            className="btn btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.35)' }}
            onClick={handleResetAllData}
            title={lang === 'hi' ? 'टेस्ट इतिहास व अध्याय महारत रीसेट करें' : 'Reset all test history & mastery'}
          >
            🗑️ {lang === 'hi' ? 'डेटा रीसेट' : 'Reset'}
          </button>

          {/* Bilingual Live Toggle */}
          <div className={styles.langToggle}>
            <button 
              className={`${styles.langBtn} ${lang === 'hi' ? styles.langBtnActive : ''}`}
              onClick={() => setLang('hi')}
            >
              🇮🇳 हिन्दी
            </button>
            <button 
              className={`${styles.langBtn} ${lang === 'en' ? styles.langBtnActive : ''}`}
              onClick={() => setLang('en')}
            >
              🇬🇧 English
            </button>
          </div>
        </div>
      </header>

      {/* VIEW 1: HOME / DASHBOARD */}
      {view === 'home' && (
        <main className="animate-fade-in">
          <section className={`${styles.hero} glass-panel`}>
            <div className={styles.heroTag}>
              <span className="badge badge-success">
                ✨ Official 2026 Primary Syllabus Calibrated • 16 Math Questions • 672 Verified Questions
              </span>
            </div>
            <h1 className={styles.heroHeading}>
              {lang === 'hi' ? (
                <>लक्ष्य 16/16 (48/48): <span className="gradient-text">सुपरटीईटी 2026</span> एडैप्टिव गणित मॉक</>
              ) : (
                <>Target 16/16 (48/48): <span className="gradient-text">SuperTET 2026</span> Adaptive Math Mock</>
              )}
            </h1>
            <p className={styles.heroSubtext}>
              {lang === 'hi' ? (
                '2026 आधिकारिक 120-प्रश्नों के प्राथमिक पाठ्यक्रम अनुसार गणित के 16 प्रश्न (+3 / -1) 25 मिनट में हल करें। नया "एडैप्टिव अभ्यास" आपकी क्षमता अनुसार प्रश्नों का स्तर स्वतः बढ़ाता और घटाता है।'
              ) : (
                'Calibrated for official 2026 primary syllabus: 16 Math questions (+3 / -1) in 25 minutes. New "Adaptive Practice" dynamically scales difficulty up or down based on your performance.'
              )}
            </p>

            {/* Quick Stats */}
            <div className={styles.statsBar}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>16 Qs (48 Marks)</div>
                <div className={styles.statLabel}>{lang === 'hi' ? '2026 आधिकारिक स्वरूप' : 'Official 2026 Format'}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>672</div>
                <div className={styles.statLabel}>{lang === 'hi' ? 'सत्यापित प्रश्न बैंक (18 टॉपिक)' : 'Verified Qs (18 Topics)'}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {history.length > 0 ? `${history[0].accuracy}%` : 'N/A'}
                </div>
                <div className={styles.statLabel}>{lang === 'hi' ? 'अंतिम टेस्ट सटीकता' : 'Latest Accuracy'}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {profile ? Object.values(profile.topics || {}).filter(t => t.mastery === 'mastered').length : 0} / 18
                </div>
                <div className={styles.statLabel}>{lang === 'hi' ? 'महारत हासिल टॉपिक (Mastered)' : 'Mastered Topics'}</div>
              </div>
            </div>
          </section>

          {/* Test Modes Selection */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              🚀 {lang === 'hi' ? 'अभ्यास मोड चुनें' : 'Select Practice Mode'}
            </h2>
          </div>

          <div className={styles.testModesGrid}>
            {/* Mode 1: Adaptive Practice (NEW) */}
            <div className={`${styles.modeCard} ${styles.modeCardFeatured} glass-panel`}>
              <div>
                <div className={styles.modeIcon}>🧠</div>
                <h3 className={styles.modeTitle}>
                  {lang === 'hi' ? 'एडैप्टिव अभ्यास (Adaptive Practice)' : 'Adaptive Practice Mode'}
                </h3>
                <p className={styles.modeDesc}>
                  {lang === 'hi' ? (
                    'गतिशील कठिनाई सीढ़ी (Dynamic Ladder): 2 सही उत्तर पर स्तर ऊपर (Easy → Medium → Hard), 1 गलत पर स्तर नीचे। आपके व्यक्तिगत स्तर का सटीक मूल्यांकन।'
                  ) : (
                    'Dynamic Difficulty Ladder: 2 correct upgrades level (Easy → Medium → Hard), 1 wrong downshifts. Real-time diagnostic calibration.'
                  )}
                </p>
                <div className={styles.modeMetaList}>
                  <span className="badge badge-success">🪜 {lang === 'hi' ? 'गतिशील सीढ़ी' : 'Dynamic Ladder'}</span>
                  <span className="badge badge-primary">🎯 16 {lang === 'hi' ? 'प्रश्न' : 'Questions'}</span>
                  <span className="badge badge-warning">📈 {lang === 'hi' ? 'प्रगति आरेख' : 'Trajectory Graph'}</span>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => startTest('adaptive', 16, 1500)}
                disabled={loading}
              >
                {loading ? 'लोड हो रहा है...' : (lang === 'hi' ? 'एडैप्टिव अभ्यास शुरू करें →' : 'Start Adaptive Practice →')}
              </button>
            </div>

            {/* Mode 2: Full Mock (16 Questions, 25 Mins) */}
            <div className={`${styles.modeCard} glass-panel`}>
              <div>
                <div className={styles.modeIcon}>🏆</div>
                <h3 className={styles.modeTitle}>
                  {lang === 'hi' ? 'सम्पूर्ण मॉक टेस्ट (Official Mock)' : 'Official 2026 Full Mock'}
                </h3>
                <p className={styles.modeDesc}>
                  {lang === 'hi' ? (
                    '2026 पाठ्यक्रम अनुसार 16 प्रश्न (10 आसान, 5 मध्यम, 1 कठिन) और 25 मिनट का टाइमर। परीक्षा जैसा सटीक माहौल (+3 / -1 निगेटिव मार्किंग)।'
                  ) : (
                    '16 Questions (10 Easy, 5 Medium, 1 Hard) with 25-minute exam countdown. Authentic exam simulation (+3 / -1 marking).'
                  )}
                </p>
                <div className={styles.modeMetaList}>
                  <span className="badge badge-primary">⏱️ 25 {lang === 'hi' ? 'मिनट' : 'Mins'}</span>
                  <span className="badge badge-warning">🎯 16 {lang === 'hi' ? 'प्रश्न' : 'Questions'}</span>
                  <span className="badge badge-danger">⚡ +3 / -1 {lang === 'hi' ? 'अंक' : 'Marks'}</span>
                </div>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => startTest('mock', 16, 1500)}
                disabled={loading}
              >
                {loading ? 'लोड हो रहा है...' : (lang === 'hi' ? 'सम्पूर्ण मॉक शुरू करें →' : 'Start Full Mock →')}
              </button>
            </div>

            {/* Mode 3: Quick Sprint */}
            <div className={`${styles.modeCard} glass-panel`}>
              <div>
                <div className={styles.modeIcon}>⚡</div>
                <h3 className={styles.modeTitle}>
                  {lang === 'hi' ? 'स्पीड स्प्रिंट (16 प्रश्न / 16 मिनट)' : 'Speed Sprint (16 Qs / 16 Mins)'}
                </h3>
                <p className={styles.modeDesc}>
                  {lang === 'hi' ? (
                    'प्रति प्रश्न 1 मिनट का सुपरफास्ट गणना अभ्यास। समय प्रबंधन और मानसिक गणना को मजबूत करने के लिए।'
                  ) : (
                    'Rapid 1-minute-per-question calculation sprint to boost speed and time management under pressure.'
                  )}
                </p>
                <div className={styles.modeMetaList}>
                  <span className="badge badge-primary">⏱️ 16 {lang === 'hi' ? 'मिनट' : 'Mins'}</span>
                  <span className="badge badge-warning">🎯 16 {lang === 'hi' ? 'प्रश्न' : 'Questions'}</span>
                </div>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => startTest('sprint', 16, 960)}
                disabled={loading}
              >
                {lang === 'hi' ? 'स्पीड स्प्रिंट शुरू करें →' : 'Start Speed Sprint →'}
              </button>
            </div>

            {/* Mode 4: Topic Drill */}
            <div className={`${styles.modeCard} glass-panel`}>
              <div>
                <div className={styles.modeIcon}>🎯</div>
                <h3 className={styles.modeTitle}>
                  {lang === 'hi' ? 'विषयवार गहन अभ्यास (Topic Drill)' : 'Topic Drill (Untimed)'}
                </h3>
                <p className={styles.modeDesc}>
                  {lang === 'hi' ? (
                    'बिना किसी टाइमर के किसी विशिष्ट अध्याय को गहराई से समझें और हल करें।'
                  ) : (
                    'Focus on one specific topic at your own relaxed pace without exam pressure.'
                  )}
                </p>
                <div className={styles.topicSelector}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {lang === 'hi' ? 'अध्याय चुनें:' : 'Select Topic:'}
                  </label>
                  <select 
                    className={styles.topicSelect}
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                  >
                    {TOPICS.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {lang === 'hi' ? t.name_hi : t.name_en} ({t.count} Qs)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                className="btn btn-secondary"
                style={{ marginTop: '20px' }}
                onClick={() => startTest('topic', 10, 0, selectedTopic)}
                disabled={loading}
              >
                {lang === 'hi' ? 'अध्याय अभ्यास शुरू करें →' : 'Start Topic Drill →'}
              </button>
            </div>
          </div>

          {/* Past History Table */}
          {history.length > 0 && (
            <div className="glass-panel" style={{ padding: '28px', marginTop: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 {lang === 'hi' ? 'आपके हालिया टेस्ट परिणाम' : 'Recent Attempt History'}
                </h3>
                <button 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                  onClick={handleResetAllData}
                >
                  🗑️ {lang === 'hi' ? 'इतिहास व आंकड़े साफ़ करें' : 'Clear History & Stats'}
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px' }}>{lang === 'hi' ? 'दिनांक' : 'Date'}</th>
                      <th style={{ padding: '10px' }}>{lang === 'hi' ? 'मोड' : 'Mode'}</th>
                      <th style={{ padding: '10px' }}>{lang === 'hi' ? 'प्राप्तांक' : 'Score'}</th>
                      <th style={{ padding: '10px' }}>{lang === 'hi' ? 'सटीकता' : 'Accuracy'}</th>
                      <th style={{ padding: '10px' }}>{lang === 'hi' ? 'सही / गलत / छूटे' : 'C / W / S'}</th>
                      <th style={{ padding: '10px' }}>{lang === 'hi' ? 'निगेटिव पेनल्टी' : 'Penalty'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 10px' }}>{h.date}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                            {h.mode || 'mock'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: '700', color: h.marksEarned >= (h.maxMarks * 0.7) ? 'var(--success)' : 'var(--warning)' }}>
                          {h.marksEarned} / {h.maxMarks}
                        </td>
                        <td style={{ padding: '12px 10px' }}>{h.accuracy}%</td>
                        <td style={{ padding: '12px 10px' }}>
                          🟢 {h.correctCount} &nbsp;|&nbsp; 🔴 {h.wrongCount} &nbsp;|&nbsp; ⚪ {h.skippedCount}
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--danger)' }}>
                          -{h.negativeLoss} {lang === 'hi' ? 'अंक' : 'marks'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      )}

      {/* VIEW 2: LIVE TEST SIMULATOR */}
      {view === 'test' && currQ && (
        <main className="animate-fade-in">
          {/* Top Sticky Test Header */}
          <div className={`${styles.testHeader} glass-panel`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">
                {currQ.topic_meta?.icon} {lang === 'hi' ? currQ.topic_meta?.name_hi : currQ.topic_meta?.name_en}
              </span>
              {/* Dynamic Difficulty Chip */}
              {renderDifficultyChip(currQ.difficulty)}

              {testConfig.mode === 'adaptive' && (
                <span className="badge badge-success">
                  🧠 {lang === 'hi' ? 'एडैप्टिव मोड' : 'Adaptive'}
                </span>
              )}
            </div>

            {/* Timer */}
            {testConfig.timeLimit > 0 && (
              <div className={`${styles.timerBox} ${timeRemaining < 180 ? styles.timerWarning : ''}`}>
                ⏱️ {formatTime(timeRemaining)}
              </div>
            )}

            <button 
              className="btn btn-danger"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={() => {
                if (confirm(lang === 'hi' ? 'क्या आप टेस्ट समाप्त करना चाहते हैं?' : 'Are you sure you want to finish the test?')) {
                  finalizeTest();
                }
              }}
            >
              🏁 {lang === 'hi' ? 'टेस्ट सबमिट करें' : 'Submit Test'}
            </button>
          </div>

          <div className={styles.testLayout}>
            {/* Left Column: Active Question */}
            <div>
              <div className={`${styles.questionCard} glass-panel`}>
                <div className={styles.qMetaBar}>
                  <div className={styles.qNumber}>
                    {lang === 'hi' ? `प्रश्न ${currentIdx + 1} / ${questions.length}` : `Question ${currentIdx + 1} of ${questions.length}`}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ID: {currQ.id} • {currQ.template_id}
                  </div>
                </div>

                {/* Question Stem */}
                <div className={styles.qStem}>
                  {lang === 'hi' ? currQ.stem_hi : currQ.stem_en}
                  <div className={styles.qStemDual}>
                    {lang === 'hi' ? currQ.stem_en : currQ.stem_hi}
                  </div>
                </div>

                {/* Visual Diagram / Figure Asset */}
                {currQ.visual && (
                  <div className={styles.visualBox}>
                    {currQ.visual.type === 'image' && (
                      <img 
                        src={currQ.visual.image_url} 
                        alt={currQ.visual.caption_hi || 'Figure'} 
                        className={styles.qVisualImage} 
                      />
                    )}
                    {currQ.visual.type === 'svg' && (
                      <div 
                        className={styles.qVisualSvg} 
                        dangerouslySetInnerHTML={{ __html: currQ.visual.svg_markup }} 
                      />
                    )}
                    {(currQ.visual.caption_hi || currQ.visual.caption_en) && (
                      <div className={styles.visualCaption}>
                        📊 {lang === 'hi' ? currQ.visual.caption_hi : currQ.visual.caption_en}
                      </div>
                    )}
                  </div>
                )}

                {/* 4 Options */}
                <div className={styles.optionsGrid}>
                  {currQ.options.map((opt) => {
                    const isSelected = answers[currQ.id] === opt.label;
                    return (
                      <button
                        key={opt.label}
                        className={`${styles.optionBtn} ${isSelected ? styles.optionSelected : ''}`}
                        onClick={() => selectOption(currQ.id, opt.label)}
                      >
                        <div className={styles.optionLabel}>{opt.label}</div>
                        <div className={styles.optionText}>
                          {lang === 'hi' ? opt.hi : opt.en}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Bar */}
                <div className={styles.testActionBar}>
                  <button 
                    className="btn btn-secondary"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                  >
                    ← {lang === 'hi' ? 'पिछला' : 'Previous'}
                  </button>

                  <button 
                    className="btn btn-secondary"
                    onClick={() => clearOption(currQ.id)}
                  >
                    🗑️ {lang === 'hi' ? 'विकल्प हटाएं' : 'Clear Choice'}
                  </button>

                  {currentIdx < questions.length - 1 ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                    >
                      {lang === 'hi' ? 'अगला →' : 'Next →'}
                    </button>
                  ) : (
                    <button 
                      className="btn btn-success"
                      onClick={finalizeTest}
                    >
                      🏁 {lang === 'hi' ? 'समीक्षा व सबमिट' : 'Review & Submit'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Question Palette Sidebar */}
            <div>
              <div className={`${styles.paletteCard} glass-panel`}>
                <div className={styles.paletteHeader}>
                  <span>{lang === 'hi' ? 'प्रश्न तालिका' : 'Question Palette'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {Object.keys(answers).length} / {questions.length}
                  </span>
                </div>

                <div className={styles.paletteLegend}>
                  <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: 'var(--success)' }}></div>
                    <span>{lang === 'hi' ? 'उत्तर दिया' : 'Answered'}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: 'var(--primary)' }}></div>
                    <span>{lang === 'hi' ? 'सक्रिय' : 'Current'}</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: 'rgba(255,255,255,0.2)' }}></div>
                    <span>{lang === 'hi' ? 'अनुत्तरित' : 'Unvisited'}</span>
                  </div>
                </div>

                <div className={styles.paletteGrid}>
                  {questions.map((q, idx) => {
                    const isAnswered = Boolean(answers[q.id]);
                    const isCurrent = idx === currentIdx;

                    let btnClass = styles.paletteBtn;
                    if (isAnswered) btnClass += ` ${styles.paletteAnswered}`;
                    if (isCurrent) btnClass += ` ${styles.paletteCurrent}`;

                    return (
                      <button
                        key={q.id}
                        className={btnClass}
                        onClick={() => setCurrentIdx(idx)}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: RESULT & DIAGNOSTICS */}
      {view === 'result' && testResult && (
        <main className="animate-fade-in">
          {/* Result Hero Header */}
          <div className={`${styles.resultHero} glass-panel`}>
            <div className={styles.scoreCircle}>
              <div className={styles.scoreNumber}>{testResult.marksEarned}</div>
              <div className={styles.scoreSub}>
                {lang === 'hi' ? `कुल ${testResult.maxMarks} में से` : `Out of ${testResult.maxMarks}`}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-success">
                  🏆 {lang === 'hi' ? 'टेस्ट विश्लेषण' : 'Test Analytics'}
                </span>
                <span className="badge badge-primary">
                  ⏱️ {lang === 'hi' ? `औसत समय: ${testResult.avgTimePerQ} से/प्रश्न` : `Avg: ${testResult.avgTimePerQ}s/Q`}
                </span>
                {testResult.mode === 'adaptive' && (
                  <span className="badge badge-warning">
                    🧠 {lang === 'hi' ? 'एडैप्टिव सीढ़ी विश्लेषण' : 'Adaptive Ladder Report'}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
                {testResult.marksEarned >= (testResult.maxMarks * 0.7) 
                  ? (lang === 'hi' ? '🎉 उत्कृष्ट प्रदर्शन, जान्हवी!' : '🎉 Outstanding Performance!')
                  : (lang === 'hi' ? '💪 अच्छा प्रयास! कमजोर क्षेत्रों पर ध्यान दें' : '💪 Good Effort! Target Weak Areas')
                }
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                {lang === 'hi' ? (
                  `आपने ${testResult.totalQuestions} में से ${testResult.correctCount} सही हल किए। आपकी सटीकता ${testResult.accuracy}% रही।`
                ) : (
                  `You answered ${testResult.correctCount} correctly out of ${testResult.totalQuestions} with ${testResult.accuracy}% accuracy.`
                )}
              </p>

              {/* 4 Metrics Boxes */}
              <div className={styles.resultBreakdownGrid}>
                <div className={styles.breakdownBox}>
                  <div className={styles.breakdownVal} style={{ color: 'var(--success)' }}>
                    +{testResult.correctCount * 3}
                  </div>
                  <div className={styles.breakdownLabel}>
                    {testResult.correctCount} {lang === 'hi' ? 'सही (+3)' : 'Correct (+3)'}
                  </div>
                </div>

                <div className={styles.breakdownBox}>
                  <div className={styles.breakdownVal} style={{ color: 'var(--danger)' }}>
                    -{testResult.wrongCount}
                  </div>
                  <div className={styles.breakdownLabel}>
                    {testResult.wrongCount} {lang === 'hi' ? 'गलत (-1)' : 'Wrong (-1)'}
                  </div>
                </div>

                <div className={styles.breakdownBox}>
                  <div className={styles.breakdownVal} style={{ color: 'var(--text-secondary)' }}>
                    0
                  </div>
                  <div className={styles.breakdownLabel}>
                    {testResult.skippedCount} {lang === 'hi' ? 'छूटे (0)' : 'Skipped (0)'}
                  </div>
                </div>

                <div className={styles.breakdownBox}>
                  <div className={styles.breakdownVal} style={{ color: 'var(--primary-light)' }}>
                    {testResult.accuracy}%
                  </div>
                  <div className={styles.breakdownLabel}>{lang === 'hi' ? 'सटीकता' : 'Accuracy'}</div>
                </div>
              </div>

              {/* Negative Marking Advice */}
              {testResult.negativeLoss > 0 && (
                <div className={styles.negativeImpactAlert}>
                  <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                  <div>
                    <strong style={{ color: '#f87171' }}>
                      {lang === 'hi' ? 'निगेटिव मार्किंग का प्रभाव:' : 'Negative Marking Impact:'}
                    </strong>
                    <div style={{ fontSize: '0.9rem', color: '#fca5a5', marginTop: '2px' }}>
                      {lang === 'hi' ? (
                        `${testResult.wrongCount} गलत उत्तरों के कारण आपके ${testResult.negativeLoss} अंक कट गए। यदि आप इन प्रश्नों को छोड़ देतीं तो आपका स्कोर ${testResult.marksEarned + testResult.negativeLoss} होता!`
                      ) : (
                        `${testResult.wrongCount} wrong answers deducted -${testResult.negativeLoss} marks. If skipped, your score would be ${testResult.marksEarned + testResult.negativeLoss}!`
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ADAPTIVE TRAJECTORY GRAPH (If adaptive mode was used) */}
          {testResult.mode === 'adaptive' && testResult.adaptiveState && (
            <div className={`${styles.trajectoryBox} glass-panel`}>
              <h3 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📈 {lang === 'hi' ? 'कठिनाई स्तर प्रगति आरेख (Adaptive Trajectory)' : 'Difficulty Level Trajectory'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {lang === 'hi' ? (
                  `सीढ़ी परिणाम: आप ${testResult.adaptiveState.highestLevelReached} स्तर तक पहुँचे। कुल ${testResult.adaptiveState.levelUpCount} बार स्तर ऊपर (Level Up) तथा ${testResult.adaptiveState.levelDownCount} बार स्तर नीचे हुआ।`
                ) : (
                  `Ladder result: You reached ${testResult.adaptiveState.highestLevelReached} level. Total ${testResult.adaptiveState.levelUpCount} level-ups and ${testResult.adaptiveState.levelDownCount} downshifts.`
                )}
              </p>

              <div className={styles.trajectoryTimeline}>
                {testResult.adaptiveState.history.map((step, idx) => {
                  let dotClass = styles.nodeDotEasy;
                  if (step.level === 'Medium') dotClass = styles.nodeDotMed;
                  if (step.level === 'Hard') dotClass = styles.nodeDotHard;

                  return (
                    <div key={idx} className={styles.trajectoryNode}>
                      <div className={`${styles.trajectoryNodeDot} ${dotClass}`}>
                        {idx + 1}
                      </div>
                      <div className={styles.trajectoryNodeLabel}>
                        {step.level.slice(0, 1)}
                      </div>
                      <div className={styles.trajectoryNodeStatus}>
                        {step.isSkipped ? '⚪' : (step.isCorrect ? '🟢' : '🔴')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Topic-Wise Breakdown */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', marginTop: '24px' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📊 {lang === 'hi' ? 'अध्यायवार प्रदर्शन विश्लेषण' : 'Topic-wise Performance Matrix'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {Object.entries(testResult.topicStats).map(([tId, t]) => {
                const pct = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
                let statusBadge = <span className="badge badge-success">Mastered ✅</span>;
                if (pct < 50) statusBadge = <span className="badge badge-danger">Weak Area ⚠️</span>;
                else if (pct < 80) statusBadge = <span className="badge badge-warning">Needs Practice 🟡</span>;

                return (
                  <div key={tId} style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                        {lang === 'hi' ? t.name_hi : t.name_en}
                      </div>
                      {statusBadge}
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '6px' }}>
                      {t.correct} / {t.total} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--success)' : (pct >= 50 ? 'var(--warning)' : 'var(--danger)') }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3-LAYER SOLUTION EXPLORER */}
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>
              📖 {lang === 'hi' ? '3-स्तरीय विस्तृत समाधान एवं भ्रांतियों का विश्लेषण' : '3-Layer Solution & Misconception Review'}
            </h3>
          </div>

          {/* Review Filter Tabs */}
          <div className={styles.reviewFilters}>
            <button 
              className={`${styles.filterBtn} ${reviewFilter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilter('all')}
            >
              {lang === 'hi' ? 'सभी प्रश्न' : 'All'} ({questions.length})
            </button>
            <button 
              className={`${styles.filterBtn} ${reviewFilter === 'wrong' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilter('wrong')}
            >
              🔴 {lang === 'hi' ? 'केवल गलत उत्तर' : 'Incorrect'} ({testResult.wrongCount})
            </button>
            <button 
              className={`${styles.filterBtn} ${reviewFilter === 'correct' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilter('correct')}
            >
              🟢 {lang === 'hi' ? 'केवल सही उत्तर' : 'Correct'} ({testResult.correctCount})
            </button>
            <button 
              className={`${styles.filterBtn} ${reviewFilter === 'skipped' ? styles.filterBtnActive : ''}`}
              onClick={() => setReviewFilter('skipped')}
            >
              ⚪ {lang === 'hi' ? 'छूटे हुए' : 'Skipped'} ({testResult.skippedCount})
            </button>
          </div>

          {/* Filtered Question Review Cards */}
          <div>
            {questions
              .filter(q => {
                const userChoice = answers[q.id];
                if (reviewFilter === 'wrong') return userChoice && userChoice !== q.correct_label;
                if (reviewFilter === 'correct') return userChoice === q.correct_label;
                if (reviewFilter === 'skipped') return !userChoice;
                return true;
              })
              .map((q, idx) => {
                const userChoice = answers[q.id];
                const isCorrect = userChoice === q.correct_label;
                const isSkipped = !userChoice;
                const chosenOptObj = q.options.find(o => o.label === userChoice);

                return (
                  <div key={q.id} className={`${styles.solutionCard} glass-panel`}>
                    {/* Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {isCorrect && (
                        <div className={`${styles.solStatusBadge} badge-success`}>
                          ✅ {lang === 'hi' ? 'सही उत्तर (+3 अंक)' : 'Correct (+3 marks)'}
                        </div>
                      )}
                      {!isCorrect && !isSkipped && (
                        <div className={`${styles.solStatusBadge} badge-danger`}>
                          ❌ {lang === 'hi' ? 'गलत उत्तर (-1 अंक)' : 'Incorrect (-1 mark)'}
                        </div>
                      )}
                      {isSkipped && (
                        <div className={`${styles.solStatusBadge} badge-warning`}>
                          ⚪ {lang === 'hi' ? 'छोड़ा गया (0 अंक)' : 'Skipped (0 marks)'}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderDifficultyChip(q.difficulty)}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {q.topic_meta?.name_hi} • {q.template_id}
                        </span>
                      </div>
                    </div>

                    {/* Question Stem */}
                    <div style={{ fontSize: '1.15rem', fontWeight: '600', margin: '14px 0', color: '#ffffff' }}>
                      {lang === 'hi' ? q.stem_hi : q.stem_en}
                    </div>

                    {/* Question Visual if available */}
                    {q.visual && (
                      <div className={styles.visualBox} style={{ margin: '12px 0' }}>
                        {q.visual.type === 'image' && (
                          <img 
                            src={q.visual.image_url} 
                            alt={q.visual.caption_hi || 'Figure'} 
                            className={styles.qVisualImage} 
                          />
                        )}
                        {q.visual.type === 'svg' && (
                          <div 
                            className={styles.qVisualSvg} 
                            dangerouslySetInnerHTML={{ __html: q.visual.svg_markup }} 
                          />
                        )}
                        {(q.visual.caption_hi || q.visual.caption_en) && (
                          <div className={styles.visualCaption}>
                            📊 {lang === 'hi' ? q.visual.caption_hi : q.visual.caption_en}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Options summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', margin: '12px 0' }}>
                      {q.options.map(opt => {
                        const isThisChosen = userChoice === opt.label;
                        const isThisCorrect = opt.label === q.correct_label;

                        let borderStyle = '1px solid rgba(255,255,255,0.08)';
                        let bgStyle = 'rgba(255,255,255,0.02)';
                        if (isThisCorrect) {
                          borderStyle = '1px solid var(--success)';
                          bgStyle = 'var(--success-bg)';
                        } else if (isThisChosen) {
                          borderStyle = '1px solid var(--danger)';
                          bgStyle = 'var(--danger-bg)';
                        }

                        return (
                          <div key={opt.label} style={{ padding: '10px 14px', borderRadius: '8px', border: borderStyle, background: bgStyle, fontSize: '0.95rem' }}>
                            <strong>({opt.label})</strong> {lang === 'hi' ? opt.hi : opt.en}
                            {isThisCorrect && ' ✅'}
                            {isThisChosen && !isThisCorrect && ' ❌'}
                          </div>
                        );
                      })}
                    </div>

                    {/* LAYER 2: MISCONCEPTION DIAGNOSIS (If wrong) */}
                    {!isCorrect && !isSkipped && chosenOptObj?.misconception_info && (
                      <div className={styles.misconceptionCard}>
                        <div className={styles.misconceptionTitle}>
                          ⚠️ {lang === 'hi' ? 'आपकी विशिष्ट मानसिक/गणना त्रुटि (Cognitive Misconception):' : 'Identified Cognitive Misconception:'}
                        </div>
                        <div style={{ fontWeight: '600', color: '#fef08a', marginBottom: '4px' }}>
                          {lang === 'hi' ? chosenOptObj.misconception_info.title_hi : chosenOptObj.misconception_info.title_en}
                        </div>
                        <div className={styles.misconceptionDesc}>
                          {lang === 'hi' ? chosenOptObj.misconception_info.desc_hi : chosenOptObj.misconception_info.desc_en}
                        </div>
                      </div>
                    )}

                    {/* LAYER 1: STEP-BY-STEP MATHEMATICAL SOLUTION */}
                    <div className={styles.stepsBox}>
                      <div className={styles.stepsTitle}>
                        📝 {lang === 'hi' ? 'चरणबद्ध प्रामाणिक हल (Step-by-Step Derivation)' : 'Step-by-Step Derivation'}
                      </div>
                      <div className={styles.stepsContent}>
                        {lang === 'hi' ? q.solution_steps_hi : q.solution_steps_en}
                      </div>
                    </div>

                    {/* LAYER 3: REMEDIAL DRILL CTA */}
                    {!isCorrect && (
                      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ fontSize: '0.82rem', padding: '6px 14px' }}
                          onClick={() => startTest('topic', 5, 0, q.topic_id)}
                        >
                          🔄 {lang === 'hi' ? `इस टॉपिक (${q.topic_meta?.name_hi}) का पुनः अभ्यास करें` : 'Drill this topic again'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Bottom Action Footer */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', margin: '40px 0', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => startTest('adaptive', 16, 1500)}
            >
              🧠 {lang === 'hi' ? 'नया एडैप्टिव अभ्यास शुरू करें' : 'Start New Adaptive Practice'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => startTest('mock', 16, 1500)}
            >
              🏆 {lang === 'hi' ? 'नया 16-प्रश्न सम्पूर्ण मॉक टेस्ट' : 'Start New 16-Q Mock'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setView('home')}
            >
              🏠 {lang === 'hi' ? 'डैशबोर्ड पर लौटें' : 'Back to Dashboard'}
            </button>
          </div>
        </main>
      )}

      {/* VIEW 4: WEAKNESS PROFILE & MASTERY DASHBOARD */}
      {view === 'weakness' && (
        <main className="animate-fade-in">
          <div className={styles.weaknessHeader}>
            <div>
              <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎯 {lang === 'hi' ? 'मेरी कमज़ोरियाँ एवं अध्याय महारत (Weak Spots & Mastery)' : 'Weak Spots & Topic Mastery'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                {lang === 'hi' ? (
                  'मध्यम या कठिन स्तर के 3 प्रश्नों को लगातार सही हल करने पर टॉपिक "Mastered" हो जाता है।'
                ) : (
                  'Answer 3 consecutive Medium/Hard questions correctly to achieve "Mastered" status.'
                )}
              </p>
            </div>

            {/* Profile Export/Import Bar */}
            <div className={styles.profileExportBar}>
              <button 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                onClick={() => exportProfileToFile(profile || loadProfile())}
              >
                💾 {lang === 'hi' ? 'प्रोफ़ाइल बैकअप (Export JSON)' : 'Backup Profile (JSON)'}
              </button>

              <button 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                📂 {lang === 'hi' ? 'प्रोफ़ाइल लोड (Import JSON)' : 'Import Profile'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportProfile} 
                accept=".json" 
                style={{ display: 'none' }} 
              />

              <button 
                className="btn btn-danger"
                style={{ fontSize: '0.85rem', padding: '6px 14px', marginLeft: 'auto' }}
                onClick={handleResetAllData}
              >
                🗑️ {lang === 'hi' ? 'सभी आंकड़े रीसेट करें' : 'Reset All Stats'}
              </button>
            </div>
          </div>

          {/* Top Misconceptions / Traps Section */}
          {profile && Object.keys(profile.misconceptions || {}).length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                ⚠️ {lang === 'hi' ? 'शीर्ष मानसिक व गणनात्मक भ्रांतियाँ (Frequent Cognitive Traps)' : 'Top Cognitive Traps Encountered'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {Object.entries(profile.misconceptions)
                  .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
                  .slice(0, 6)
                  .map(([tag, data]) => {
                    const cleanTitle = tag.replace('misconception:', '').replace(/_/g, ' ').toUpperCase();
                    return (
                      <div key={tag} style={{ padding: '14px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fef08a' }}>
                            {cleanTitle}
                          </span>
                          <span className="badge badge-danger">
                            {data.count} {lang === 'hi' ? 'बार' : 'times'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Topic: {data.topic_id || 'Math'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 18 Syllabus Topics Mastery Grid */}
          <h3 style={{ marginBottom: '16px' }}>
            📚 {lang === 'hi' ? 'सभी 18 पाठ्यक्रम अध्यायों की प्रगति स्थिति' : 'All 18 Syllabus Topics Status'}
          </h3>

          <div className={styles.masteryOverviewGrid}>
            {TOPICS.map((topic) => {
              const tData = profile?.topics?.[topic.id] || {
                attempts: 0,
                correct: 0,
                mastery: 'new',
                by_level: { Easy: { a: 0, c: 0 }, Medium: { a: 0, c: 0 }, Hard: { a: 0, c: 0 } }
              };

              const weakness = computeTopicWeakness(tData);
              const accuracy = tData.attempts > 0 ? Math.round((tData.correct / tData.attempts) * 100) : 0;

              return (
                <div key={topic.id} className={styles.masteryCard}>
                  <div className={styles.masteryCardHeader}>
                    <div>
                      <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{topic.icon}</div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                        {lang === 'hi' ? topic.name_hi : topic.name_en}
                      </div>
                    </div>

                    <div>
                      {tData.mastery === 'mastered' && (
                        <span className={styles.masteryBadgeMastered}>
                          🌟 {lang === 'hi' ? 'महारत (Mastered)' : 'Mastered'}
                        </span>
                      )}
                      {tData.mastery === 'learning' && (
                        <span className={styles.masteryBadgeLearning}>
                          🔄 {lang === 'hi' ? 'सीख रहे हैं' : 'Learning'}
                        </span>
                      )}
                      {tData.mastery === 'new' && (
                        <span className={styles.masteryBadgeNew}>
                          🆕 {lang === 'hi' ? 'प्रारंभ करें' : 'New'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    {lang === 'hi' ? 'प्रयास:' : 'Attempts:'} <strong>{tData.attempts}</strong> &nbsp;|&nbsp; 
                    {lang === 'hi' ? 'सटीकता:' : 'Accuracy:'} <strong>{accuracy}%</strong>
                  </div>

                  <div className={styles.weaknessProgressBar}>
                    <div 
                      style={{ 
                        width: `${accuracy}%`, 
                        height: '100%', 
                        background: accuracy >= 75 ? 'var(--success)' : (accuracy >= 40 ? 'var(--warning)' : 'var(--danger)') 
                      }}
                    />
                  </div>

                  {/* Level breakdown */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span>E: {tData.by_level?.Easy?.c || 0}/{tData.by_level?.Easy?.a || 0}</span>
                    <span>M: {tData.by_level?.Medium?.c || 0}/{tData.by_level?.Medium?.a || 0}</span>
                    <span>H: {tData.by_level?.Hard?.c || 0}/{tData.by_level?.Hard?.a || 0}</span>
                  </div>

                  <button 
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '14px', fontSize: '0.8rem', padding: '6px' }}
                    onClick={() => startTest('topic', 10, 0, topic.id)}
                  >
                    🎯 {lang === 'hi' ? 'इस अध्याय का अभ्यास करें →' : 'Drill this topic →'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button className="btn btn-primary" onClick={() => setView('home')}>
              🏠 {lang === 'hi' ? 'डैशबोर्ड पर वापस जाएँ' : 'Return to Dashboard'}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
