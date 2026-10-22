/**
 * SuperTET Math Profile & Mastery Engine
 * Storage Key: 'supertet_math_profile_v1'
 * Pure JavaScript logic with 0 React/DOM dependencies for universal client & node execution.
 */

export const PROFILE_STORAGE_KEY = 'supertet_math_profile_v1';
export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Creates a blank profile matching schema v1
 */
export function createDefaultProfile() {
  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    topics: {},
    misconceptions: {},
    template_stats: {},
    seen_ids: [] // capped at 300
  };
}

/**
 * Load profile safely from localStorage
 */
export function loadProfile() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createDefaultProfile();
  }
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schema_version !== CURRENT_SCHEMA_VERSION) {
      // Migrate or reset safely
      return { ...createDefaultProfile(), ...parsed, schema_version: CURRENT_SCHEMA_VERSION };
    }
    return parsed;
  } catch (err) {
    console.warn('Failed to load math profile, using default:', err);
    return createDefaultProfile();
  }
}

/**
 * Save profile safely to localStorage
 */
export function saveProfile(profile) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    profile.last_updated = new Date().toISOString();
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save math profile:', err);
  }
}

/**
 * Clear profile from localStorage and reset to default
 */
export function clearProfile() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  }
  return createDefaultProfile();
}

/**
 * Update profile after a single question is answered
 * @param {Object} profile - mutable or cloned profile
 * @param {Object} question - question object { id, topic_id, difficulty, template_id, options, correct_label }
 * @param {string|null} chosenLabel - user's selected option label ('A', 'B', etc.) or null if skipped
 * @returns {Object} updated profile
 */
export function updateProfileAfterAnswer(profile, question, chosenLabel) {
  if (!profile) profile = createDefaultProfile();
  const qId = question.id;
  const tId = question.topic_id || 'T01';
  const tmplId = question.template_id || 'general';
  const level = question.difficulty || 'Medium';

  // 1. Maintain seen_ids (cap at 300)
  if (!profile.seen_ids) profile.seen_ids = [];
  if (!profile.seen_ids.includes(qId)) {
    profile.seen_ids.push(qId);
    if (profile.seen_ids.length > 300) {
      profile.seen_ids.shift();
    }
  }

  // If skipped, we only record seen_id, no mastery penalty
  if (!chosenLabel) {
    return profile;
  }

  const isCorrect = chosenLabel === question.correct_label;

  // 2. Topic Stats
  if (!profile.topics[tId]) {
    profile.topics[tId] = {
      attempts: 0,
      correct: 0,
      recent: [], // last 5 outcomes: 1 for correct, 0 for wrong
      by_level: {
        Easy: { a: 0, c: 0 },
        Medium: { a: 0, c: 0 },
        Hard: { a: 0, c: 0 }
      },
      mastery: 'learning', // 'new' | 'learning' | 'mastered'
      consecutive_medium_hard_correct: 0
    };
  }

  const topicEntry = profile.topics[tId];
  topicEntry.attempts += 1;
  if (isCorrect) topicEntry.correct += 1;

  // Update level specific counters
  if (!topicEntry.by_level[level]) {
    topicEntry.by_level[level] = { a: 0, c: 0 };
  }
  topicEntry.by_level[level].a += 1;
  if (isCorrect) topicEntry.by_level[level].c += 1;

  // Update recent sliding window (keep last 5)
  if (!topicEntry.recent) topicEntry.recent = [];
  topicEntry.recent.push(isCorrect ? 1 : 0);
  if (topicEntry.recent.length > 5) {
    topicEntry.recent.shift();
  }

  // 3. Mastery Evaluation
  // Rule: Mastered when last 3 answers at Medium or Hard are all correct.
  // Demote to 'learning' when 2 of the last 4 answers are wrong.
  if (level === 'Medium' || level === 'Hard') {
    if (isCorrect) {
      topicEntry.consecutive_medium_hard_correct = (topicEntry.consecutive_medium_hard_correct || 0) + 1;
      if (topicEntry.consecutive_medium_hard_correct >= 3) {
        topicEntry.mastery = 'mastered';
      }
    } else {
      topicEntry.consecutive_medium_hard_correct = 0;
    }
  }

  // Demote check: if 2 of last 4 in recent are wrong (0)
  if (topicEntry.recent.length >= 4) {
    const lastFour = topicEntry.recent.slice(-4);
    const wrongCountInFour = lastFour.filter(x => x === 0).length;
    if (wrongCountInFour >= 2 && topicEntry.mastery === 'mastered') {
      topicEntry.mastery = 'learning';
      topicEntry.consecutive_medium_hard_correct = 0;
    }
  }

  // 4. Misconception Tracking
  if (!isCorrect) {
    const chosenOpt = (question.options || []).find(o => o.label === chosenLabel);
    const tag = chosenOpt?.misconception_tag;
    if (tag) {
      if (!profile.misconceptions) profile.misconceptions = {};
      if (!profile.misconceptions[tag]) {
        profile.misconceptions[tag] = { count: 0, topic_id: tId, last_seen: new Date().toISOString() };
      }
      profile.misconceptions[tag].count += 1;
      profile.misconceptions[tag].last_seen = new Date().toISOString();
    }
  }

  // 5. Template Stats
  if (!profile.template_stats) profile.template_stats = {};
  if (!profile.template_stats[tmplId]) {
    profile.template_stats[tmplId] = { a: 0, c: 0 };
  }
  profile.template_stats[tmplId].a += 1;
  if (isCorrect) profile.template_stats[tmplId].c += 1;

  return profile;
}

/**
 * Computes weakness score for a topic
 * Formula: weakness = 0.5 * (1 - recent_accuracy) + 0.3 * (1 - overall_accuracy) + 0.2 * misconception_weight
 * Range: 0 (completely mastered) to 1.0 (severely weak)
 */
export function computeTopicWeakness(topicEntry, totalMisconceptionsForTopic = 0) {
  if (!topicEntry || topicEntry.attempts === 0) {
    return 0.5; // Unknown / unexplored topic gets default 0.5
  }

  const overallAccuracy = topicEntry.attempts > 0 ? (topicEntry.correct / topicEntry.attempts) : 0;
  
  let recentAccuracy = overallAccuracy;
  if (topicEntry.recent && topicEntry.recent.length >= 3) {
    const sum = topicEntry.recent.reduce((a, b) => a + b, 0);
    recentAccuracy = sum / topicEntry.recent.length;
  }

  const misconceptionWeight = Math.min(1.0, totalMisconceptionsForTopic / Math.max(1, topicEntry.attempts));

  const score = (0.5 * (1 - recentAccuracy)) + 
                (0.3 * (1 - overallAccuracy)) + 
                (0.2 * misconceptionWeight);

  return Math.max(0.0, Math.min(1.0, score));
}

/**
 * Computes normalized topic weights for question selector
 * Higher weight = topic gets picked more often
 */
export function computeTopicWeights(profile, allTopicIds) {
  const weights = {};
  const misconceptions = profile?.misconceptions || {};

  allTopicIds.forEach(tId => {
    const entry = profile?.topics?.[tId];
    // count misconceptions for this topic
    let misCount = 0;
    Object.values(misconceptions).forEach(m => {
      if (m.topic_id === tId) misCount += (m.count || 0);
    });

    let w = computeTopicWeakness(entry, misCount);

    // Mastered topics get 0.3 multiplier but never zero (spaced repetition)
    if (entry?.mastery === 'mastered') {
      w *= 0.3;
    }

    // Floor of 0.1 so every topic has a non-zero probability
    weights[tId] = Math.max(0.1, Number(w.toFixed(3)));
  });

  return weights;
}

/**
 * Export profile to JSON file download in browser
 */
export function exportProfileToFile(profile) {
  if (typeof window === 'undefined') return;
  const jsonStr = JSON.stringify(profile, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `supertet_math_profile_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import profile from JSON string
 */
export function importProfileFromJSON(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON structure');
  }
  if (!parsed.schema_version) {
    throw new Error('Missing schema_version in profile');
  }
  saveProfile(parsed);
  return parsed;
}
