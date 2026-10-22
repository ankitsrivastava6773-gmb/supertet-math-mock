import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bundledQuestions from '@/data/questions.json';

/**
 * SuperTET Math Mock System - Calibrated Question Selection API
 * Supports:
 * - mode: 'mock' (16-question official syllabus mix: 10 Easy, 5 Medium, 1 Hard)
 *         'adaptive' (single or batch with dynamic difficulty)
 *         'topic' (topic drill)
 *         'sprint' (16 rapid questions)
 * - difficulty: 'Easy' | 'Medium' | 'Hard'
 * - exclude: comma-separated question IDs
 * - topic_weights: e.g. 'T01:2.5,T05:1.2'
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'mock';
    const countParam = searchParams.get('count');
    const requestedDifficulty = searchParams.get('difficulty');
    const topicId = searchParams.get('topic_id') || searchParams.get('topic');
    const templateId = searchParams.get('template_id') || searchParams.get('template');
    const excludeRaw = searchParams.get('exclude') || '';
    const topicWeightsRaw = searchParams.get('topic_weights') || '';

    // Default count: 16 questions for mock/adaptive/sprint (SuperTET 2026 Primary Syllabus: 16 Math Qs)
    const count = countParam ? parseInt(countParam, 10) : 16;
    const excludeSet = new Set(excludeRaw.split(',').map(s => s.trim()).filter(Boolean));

    // Parse topic weights if provided
    const topicWeights = {};
    if (topicWeightsRaw) {
      topicWeightsRaw.split(',').forEach(pair => {
        const [t, w] = pair.split(':');
        if (t && w) topicWeights[t.trim()] = parseFloat(w.trim()) || 1.0;
      });
    }

    // Direct bundled question bank (optimal for Vercel/Serverless deployment)
    let allQuestions = bundledQuestions;
    if (!allQuestions || allQuestions.length === 0) {
      const filePath = path.join(process.cwd(), 'data', 'questions.json');
      if (fs.existsSync(filePath)) {
        allQuestions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    }

    // Initial filter by template if specified
    let candidates = allQuestions;
    if (templateId) {
      candidates = candidates.filter(q => q.template_id === templateId);
    }
    if (topicId) {
      candidates = candidates.filter(q => q.topic_id === topicId);
    }

    // Helper: Fisher-Yates shuffle
    const shuffle = (arr) => {
      const res = [...arr];
      for (let i = res.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [res[i], res[j]] = [res[j], res[i]];
      }
      return res;
    };

    let selected = [];

    // Fallback Ladder Helper for single difficulty requests
    const getFallbackOrder = (diff) => {
      if (diff === 'Hard') return ['Hard', 'Medium', 'Easy'];
      if (diff === 'Medium') return ['Medium', 'Hard', 'Easy'];
      return ['Easy', 'Medium', 'Hard'];
    };

    if (mode === 'mock') {
      // Official 2026 Syllabus Mix:
      // In 16 questions: 10 Easy, 5 Medium, 1 Hard
      // In 20 questions: 13 Easy, 6 Medium, 1 Hard
      const targetEasy = Math.round(count * (10 / 16));
      const targetMedium = Math.round(count * (5 / 16));
      const targetHard = Math.max(1, count - targetEasy - targetMedium);

      const targets = {
        'Easy': targetEasy,
        'Medium': targetMedium,
        'Hard': targetHard
      };

      // Bucket available candidates by difficulty (prioritizing non-excluded)
      const buckets = { 'Easy': [], 'Medium': [], 'Hard': [] };
      candidates.forEach(q => {
        const d = q.difficulty || 'Medium';
        if (buckets[d]) {
          buckets[d].push(q);
        }
      });

      // Split into unvisited and visited
      const unvisited = {
        'Easy': shuffle(buckets['Easy'].filter(q => !excludeSet.has(q.id))),
        'Medium': shuffle(buckets['Medium'].filter(q => !excludeSet.has(q.id))),
        'Hard': shuffle(buckets['Hard'].filter(q => !excludeSet.has(q.id)))
      };

      // If unvisited bucket exhausted, replenish from visited
      ['Easy', 'Medium', 'Hard'].forEach(lvl => {
        if (unvisited[lvl].length < targets[lvl]) {
          const visited = shuffle(buckets[lvl].filter(q => excludeSet.has(q.id)));
          unvisited[lvl] = [...unvisited[lvl], ...visited];
        }
      });

      // Group unvisited candidates by topic for fair topic distribution
      const pickFromBucket = (lvl, needed) => {
        const picked = [];
        const pool = unvisited[lvl];
        // Sort/prioritize with topicWeights if given
        if (Object.keys(topicWeights).length > 0) {
          pool.sort((a, b) => (topicWeights[b.topic_id] || 0.5) - (topicWeights[a.topic_id] || 0.5));
        }
        while (picked.length < needed && pool.length > 0) {
          const item = pool.shift();
          picked.push({
            ...item,
            served_difficulty: item.difficulty,
            fallback_used: false
          });
        }
        return picked;
      };

      const easyPicks = pickFromBucket('Easy', targets['Easy']);
      const medPicks = pickFromBucket('Medium', targets['Medium']);
      const hardPicks = pickFromBucket('Hard', targets['Hard']);

      selected = [...easyPicks, ...medPicks, ...hardPicks];

      // If still short of total count, borrow from any available level with fallback flag
      if (selected.length < count) {
        const remainingPool = shuffle(candidates.filter(q => !selected.some(s => s.id === q.id)));
        while (selected.length < count && remainingPool.length > 0) {
          const borrow = remainingPool.shift();
          selected.push({
            ...borrow,
            served_difficulty: borrow.difficulty,
            fallback_used: true
          });
        }
      }

      // Final shuffle of the mock test paper so difficulties are naturally interleaved
      selected = shuffle(selected).slice(0, count);

    } else if (requestedDifficulty) {
      // Specific difficulty requested (e.g. adaptive step or targeted drill)
      const ladder = getFallbackOrder(requestedDifficulty);
      let pickedQuestion = null;

      for (const lvl of ladder) {
        let pool = candidates.filter(q => q.difficulty === lvl && !excludeSet.has(q.id));
        if (pool.length === 0) {
          pool = candidates.filter(q => q.difficulty === lvl);
        }
        if (pool.length > 0) {
          const chosen = pool[Math.floor(Math.random() * pool.length)];
          pickedQuestion = {
            ...chosen,
            served_difficulty: lvl,
            fallback_used: lvl !== requestedDifficulty
          };
          break;
        }
      }

      if (pickedQuestion) {
        selected = [pickedQuestion];
      } else {
        // Universal safety net
        const anyQ = candidates[Math.floor(Math.random() * candidates.length)];
        selected = [{
          ...anyQ,
          served_difficulty: anyQ.difficulty,
          fallback_used: true
        }];
      }

    } else {
      // General or Topic selection
      let pool = candidates.filter(q => !excludeSet.has(q.id));
      if (pool.length < count) pool = candidates;

      const shuffledPool = shuffle(pool);
      selected = shuffledPool.slice(0, count).map(q => ({
        ...q,
        served_difficulty: q.difficulty,
        fallback_used: false
      }));
    }

    return NextResponse.json({
      success: true,
      total: selected.length,
      mode,
      target_count: count,
      questions: selected
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
