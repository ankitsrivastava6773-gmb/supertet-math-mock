/**
 * SuperTET Adaptive Ladder & Dynamic Question Selection Engine
 * Pure JavaScript logic with 0 React/DOM dependencies.
 */

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'];

/**
 * Creates a fresh state for an Adaptive Practice session
 */
export function createAdaptiveSessionState(initialLevel = 'Easy') {
  return {
    currentLevel: initialLevel,
    streakCorrect: 0,
    streakWrong: 0,
    history: [], // [{ qIdx, qId, level, isCorrect, chosenLabel }]
    highestLevelReached: initialLevel,
    levelUpCount: 0,
    levelDownCount: 0
  };
}

/**
 * Computes next level based on answer outcome
 * Rules:
 * - 2 consecutive correct -> level up
 * - 1 wrong -> level down
 * - skipped -> unchanged
 */
export function processAdaptiveAnswer(state, question, chosenLabel) {
  const currentIdx = state.history.length;
  const currentLevel = state.currentLevel;
  const isSkipped = !chosenLabel;
  const isCorrect = !isSkipped && chosenLabel === question.correct_label;

  let nextLevel = currentLevel;
  let newStreakCorrect = state.streakCorrect;
  let newStreakWrong = state.streakWrong;
  let newLevelUp = state.levelUpCount;
  let newLevelDown = state.levelDownCount;

  if (!isSkipped) {
    if (isCorrect) {
      newStreakCorrect += 1;
      newStreakWrong = 0;
      if (newStreakCorrect >= 2) {
        // Level UP
        if (currentLevel === 'Easy') {
          nextLevel = 'Medium';
          newLevelUp += 1;
        } else if (currentLevel === 'Medium') {
          nextLevel = 'Hard';
          newLevelUp += 1;
        }
        newStreakCorrect = 0;
      }
    } else {
      newStreakWrong += 1;
      newStreakCorrect = 0;
      if (newStreakWrong >= 1) {
        // Level DOWN
        if (currentLevel === 'Hard') {
          nextLevel = 'Medium';
          newLevelDown += 1;
        } else if (currentLevel === 'Medium') {
          nextLevel = 'Easy';
          newLevelDown += 1;
        }
        newStreakWrong = 0;
      }
    }
  }

  // Update highest level reached
  const levelRanks = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
  const highest = levelRanks[nextLevel] > levelRanks[state.highestLevelReached]
    ? nextLevel
    : state.highestLevelReached;

  const updatedHistory = [
    ...state.history,
    {
      qIdx: currentIdx,
      qId: question.id,
      topic_id: question.topic_id,
      level: currentLevel,
      isCorrect,
      isSkipped,
      chosenLabel
    }
  ];

  return {
    currentLevel: nextLevel,
    streakCorrect: newStreakCorrect,
    streakWrong: newStreakWrong,
    history: updatedHistory,
    highestLevelReached: highest,
    levelUpCount: newLevelUp,
    levelDownCount: newLevelDown
  };
}

/**
 * Fallback ladder order generator for difficulty
 */
export function getDifficultyFallbackLadder(requestedLevel) {
  if (requestedLevel === 'Hard') return ['Hard', 'Medium', 'Easy'];
  if (requestedLevel === 'Medium') return ['Medium', 'Hard', 'Easy'];
  return ['Easy', 'Medium', 'Hard'];
}

/**
 * Filter questions with exclude list and fallback
 */
export function selectQuestionWithFallback(allQuestions, { topicId, targetLevel, excludeIds = [] }) {
  const excludeSet = new Set(excludeIds);
  const ladder = getDifficultyFallbackLadder(targetLevel);

  for (const level of ladder) {
    let pool = allQuestions.filter(q => {
      if (topicId && q.topic_id !== topicId) return false;
      if (q.difficulty !== level) return false;
      return !excludeSet.has(q.id);
    });

    // If pool is empty because of excludeSet, allow resetting excludeSet for this specific bucket
    if (pool.length === 0) {
      pool = allQuestions.filter(q => {
        if (topicId && q.topic_id !== topicId) return false;
        return q.difficulty === level;
      });
    }

    if (pool.length > 0) {
      const selected = pool[Math.floor(Math.random() * pool.length)];
      return {
        question: { ...selected },
        served_difficulty: level,
        fallback_used: level !== targetLevel
      };
    }
  }

  // Final fallback: any question not in exclude, or any question at all
  let finalPool = allQuestions.filter(q => !excludeSet.has(q.id));
  if (finalPool.length === 0) finalPool = allQuestions;
  const picked = finalPool[Math.floor(Math.random() * finalPool.length)];
  return {
    question: { ...picked },
    served_difficulty: picked.difficulty,
    fallback_used: true
  };
}
