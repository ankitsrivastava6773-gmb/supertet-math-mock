'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './print.module.css';

export default function PrintExamPaper() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paperSeries, setPaperSeries] = useState('A');
  const [paperDate, setPaperDate] = useState('');

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/questions?mode=mock&count=20');
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
      }
    } catch (e) {
      console.error('Failed to load questions for print paper', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    const now = new Date();
    setPaperDate(now.toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' }));
    const seriesList = ['A', 'B', 'C', 'D'];
    setPaperSeries(seriesList[Math.floor(Math.random() * seriesList.length)]);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', background: '#0a0d1a', color: '#fff', minHeight: '100vh' }}>
        <h2>📄 सुपरटीईटी 2026 गणित प्रश्न-पत्र तैयार हो रहा है...</h2>
        <p style={{ color: '#94a3b8' }}>कृपया प्रतीक्षा करें, 20 संतुलित प्रश्न और उत्तर-कुंजी लोड हो रहे हैं।</p>
      </div>
    );
  }

  return (
    <div className={styles.printContainer}>
      {/* Top Action Bar (Hidden during printing) */}
      <div className={styles.topBar}>
        <div className={styles.topBarTitle}>
          <span>🖨️ सुपरटीईटी 2026 गणित ऑफलाइन मॉडल पेपर (Print View)</span>
        </div>
        <div className={styles.topBarActions}>
          <button className={styles.actionBtn} onClick={handlePrint}>
            🖨️ प्रिंट करें / Save as PDF
          </button>
          <button className={styles.secondaryBtn} onClick={loadQuestions}>
            🔄 नया पेपर जनरेट करें
          </button>
          <Link href="/">
            <button className={styles.secondaryBtn}>
              ← ऑनलाइन टेस्ट ऐप
            </button>
          </Link>
        </div>
      </div>

      {/* PAGE 1: EXAMINATION QUESTION PAPER */}
      <div className={styles.examHeader}>
        <div className={styles.examTitle}>
          उत्तर प्रदेश सहायक अध्यापक भर्ती परीक्षा (SuperTET 2026)
        </div>
        <div className={styles.examSubtitle}>
          गणित मॉडल प्रश्न-पत्र • Mathematics Practice Paper (सीरीज / Series: {paperSeries})
        </div>
        <div className={styles.examMetaRow}>
          <span>कुल प्रश्न: 20</span>
          <span>पूर्णांक: 60 अंक (+3 / -1)</span>
          <span>समय: 20 मिनट</span>
          <span>दिनांक: {paperDate}</span>
        </div>
        <div className={styles.candidateInfoRow}>
          <span>अनुक्रमांक (Roll No.): ____________________</span>
          <span>परीक्षार्थी का नाम: ____________________</span>
          <span>हस्ताक्षर: _______________</span>
        </div>
      </div>

      {/* Instructions */}
      <div className={styles.instructionsBox}>
        <strong>निर्देश (Instructions):</strong>
        <ul>
          <li>इस प्रश्न-पत्र में कुल 20 बहुविकल्पीय प्रश्न हैं। प्रत्येक प्रश्न के चार विकल्प (A, B, C, D) दिए गए हैं।</li>
          <li>प्रत्येक सही उत्तर हेतु <strong>+3 अंक</strong> प्रदान किए जाएंगे तथा प्रत्येक गलत उत्तर हेतु <strong>-1 अंक</strong> काटा जाएगा (निगेटिव मार्किंग)।</li>
          <li>अपने उत्तर नीचे दिए गए ओएमआर (OMR) बॉक्स में केवल काले या नीले बॉलपॉइंट पेन से भरें।</li>
        </ul>
      </div>

      {/* Questions List */}
      <div className={styles.questionsGrid}>
        {questions.map((q, idx) => (
          <div key={q.id} className={styles.qItem}>
            <div className={styles.qStemHi}>
              <span className={styles.qNum}>प्र.{idx + 1}.</span> {q.stem_hi}
            </div>
            <div className={styles.qStemEn}>
              <span className={styles.qNum}>Q.{idx + 1}.</span> {q.stem_en}
            </div>

            {/* Visual Figure if question has one */}
            {q.visual && (
              <div className={styles.qVisualWrapper}>
                {q.visual.type === 'image' && (
                  <img src={q.visual.image_url} alt={q.visual.caption_hi || 'Figure'} />
                )}
                {q.visual.type === 'svg' && (
                  <div dangerouslySetInnerHTML={{ __html: q.visual.svg_markup }} />
                )}
              </div>
            )}

            {/* 4 Options */}
            <div className={styles.optionsRow}>
              {q.options.map((opt) => (
                <div key={opt.label} className={styles.optItem}>
                  <span className={styles.optLabel}>({opt.label})</span>
                  <span className={styles.optText}>{opt.hi} / {opt.en}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* OMR SHEET */}
      <div className={styles.omrContainer}>
        <div className={styles.omrTitle}>
          उत्तर-पत्रक • OMR ANSWER SHEET (QUESTIONS 1 – 20)
        </div>
        <div className={styles.omrGrid}>
          {questions.map((_, idx) => (
            <div key={idx} className={styles.omrRow}>
              <span className={styles.omrQNum}>Q{idx + 1}.</span>
              <div className={styles.omrBubbles}>
                <span className={styles.bubble}>A</span>
                <span className={styles.bubble}>B</span>
                <span className={styles.bubble}>C</span>
                <span className={styles.bubble}>D</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PAGE 2 / 3: ANSWER KEY & DETAILED SOLUTIONS */}
      <div className={styles.pageBreak}>
        <div className={styles.keyHeader}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
            उत्तर-कुंजी एवं व्याख्यात्मक हल • Answer Key & Detailed Solutions
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#4b5563', margin: 0 }}>
            SuperTET 2026 Mathematics Mock Test Paper (Series {paperSeries})
          </p>
        </div>

        {/* Answer Key Grid */}
        <table className={styles.keyTable}>
          <thead>
            <tr>
              {questions.slice(0, 10).map((_, i) => (
                <th key={i}>Q{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {questions.slice(0, 10).map((q, i) => (
                <td key={i}><strong>{q.correct_label}</strong></td>
              ))}
            </tr>
          </tbody>
          <thead>
            <tr>
              {questions.slice(10, 20).map((_, i) => (
                <th key={i + 10}>Q{i + 11}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {questions.slice(10, 20).map((q, i) => (
                <td key={i + 10}><strong>{q.correct_label}</strong></td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Step-by-Step Solutions */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '16px' }}>
            विस्तृत चरणबद्ध समाधान (Step-by-Step Mathematical Derivations):
          </h3>

          {questions.map((q, idx) => (
            <div key={q.id} className={styles.solItem}>
              <div className={styles.solHeader}>
                प्र.{idx + 1}. सही उत्तर: विकल्प ({q.correct_label}) — {q.correct_answer_str} [{q.topic_meta?.name_hi}]
              </div>
              <div className={styles.solSteps}>
                {q.solution_steps_hi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
