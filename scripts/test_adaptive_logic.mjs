/**
 * Unit Test Suite for SuperTET Adaptive Engine, Profile & Mastery Logic
 * Run with: node scripts/test_adaptive_logic.mjs
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  createDefaultProfile,
  updateProfileAfterAnswer,
  computeTopicWeakness,
  computeTopicWeights
} from '../app/lib/profile.js';

import {
  createAdaptiveSessionState,
  processAdaptiveAnswer,
  getDifficultyFallbackLadder
} from '../app/lib/adaptiveEngine.js';

// Test Profile Logic
function testProfileLogic() {
  console.log('Testing Profile & Mastery logic...');

  let prof = createDefaultProfile();
  assert.strictEqual(prof.schema_version, 1, 'Schema version must be 1');
  assert.deepStrictEqual(prof.topics, {}, 'Topics should start empty');

  const qEasy = {
    id: 'STET_M_001',
    topic_id: 'T11',
    template_id: 'si_direct_interest_calc',
    difficulty: 'Easy',
    correct_label: 'A',
    options: [
      { label: 'A', is_correct: true },
      { label: 'B', is_correct: false, misconception_tag: 'misconception:divided_by_10_instead_of_100' }
    ]
  };

  const qMed = {
    id: 'STET_M_002',
    topic_id: 'T11',
    template_id: 'si_multiplier_relation',
    difficulty: 'Medium',
    correct_label: 'C',
    options: [
      { label: 'C', is_correct: true },
      { label: 'B', is_correct: false, misconception_tag: 'misconception:linear_scaling_on_multiplier' }
    ]
  };

  // 1. Answer Easy correct
  prof = updateProfileAfterAnswer(prof, qEasy, 'A');
  assert.strictEqual(prof.topics['T11'].attempts, 1);
  assert.strictEqual(prof.topics['T11'].correct, 1);
  assert.strictEqual(prof.topics['T11'].mastery, 'learning', 'Easy correct should not grant mastery');

  // 2. Answer Medium correct 3 times consecutively
  prof = updateProfileAfterAnswer(prof, qMed, 'C'); // Med 1
  prof = updateProfileAfterAnswer(prof, qMed, 'C'); // Med 2
  assert.strictEqual(prof.topics['T11'].mastery, 'learning');
  prof = updateProfileAfterAnswer(prof, qMed, 'C'); // Med 3
  assert.strictEqual(prof.topics['T11'].mastery, 'mastered', '3 consecutive Med/Hard correct must grant mastery');

  // 3. Demote on 2 wrong in last 4
  prof = updateProfileAfterAnswer(prof, qMed, 'B'); // wrong 1
  prof = updateProfileAfterAnswer(prof, qMed, 'B'); // wrong 2
  assert.strictEqual(prof.topics['T11'].mastery, 'learning', '2 wrong out of 4 must demote from mastered to learning');

  // 4. Misconceptions tracking
  assert(prof.misconceptions['misconception:linear_scaling_on_multiplier'].count >= 2, 'Misconception must be counted');

  // 5. Weakness and Weights
  const weakness = computeTopicWeakness(prof.topics['T11'], 2);
  assert(weakness >= 0 && weakness <= 1, 'Weakness must be bounded 0..1');

  const weights = computeTopicWeights(prof, ['T11', 'T01']);
  assert(weights['T11'] >= 0.1, 'Weight must have minimum floor 0.1');

  console.log('✅ Profile & Mastery tests PASSED!');
}

// Test Adaptive Ladder Logic
function testAdaptiveLadder() {
  console.log('\nTesting Adaptive Ladder logic...');

  let state = createAdaptiveSessionState('Easy');
  assert.strictEqual(state.currentLevel, 'Easy');

  const dummyQEasy = { id: 'Q1', topic_id: 'T01', difficulty: 'Easy', correct_label: 'A' };
  const dummyQMed = { id: 'Q2', topic_id: 'T01', difficulty: 'Medium', correct_label: 'B' };
  const dummyQHard = { id: 'Q3', topic_id: 'T01', difficulty: 'Hard', correct_label: 'C' };

  // 1. One correct: stays Easy
  state = processAdaptiveAnswer(state, dummyQEasy, 'A');
  assert.strictEqual(state.currentLevel, 'Easy', '1 correct should stay Easy');

  // 2. Second correct: level up to Medium
  state = processAdaptiveAnswer(state, dummyQEasy, 'A');
  assert.strictEqual(state.currentLevel, 'Medium', '2 consecutive correct must level up to Medium');

  // 3. Two correct at Medium: level up to Hard
  state = processAdaptiveAnswer(state, dummyQMed, 'B');
  state = processAdaptiveAnswer(state, dummyQMed, 'B');
  assert.strictEqual(state.currentLevel, 'Hard', '2 consecutive correct at Medium must level up to Hard');
  assert.strictEqual(state.highestLevelReached, 'Hard');

  // 4. Hard with 2 correct: clamped at Hard
  state = processAdaptiveAnswer(state, dummyQHard, 'C');
  state = processAdaptiveAnswer(state, dummyQHard, 'C');
  assert.strictEqual(state.currentLevel, 'Hard', 'Must clamp at Hard');

  // 5. One wrong at Hard: level down to Medium
  state = processAdaptiveAnswer(state, dummyQHard, 'A'); // wrong
  assert.strictEqual(state.currentLevel, 'Medium', '1 wrong must downshift Hard to Medium');

  // 6. One wrong at Medium: level down to Easy
  state = processAdaptiveAnswer(state, dummyQMed, 'A'); // wrong
  assert.strictEqual(state.currentLevel, 'Easy', '1 wrong must downshift Medium to Easy');

  // 7. One wrong at Easy: clamped at Easy
  state = processAdaptiveAnswer(state, dummyQEasy, 'B'); // wrong
  assert.strictEqual(state.currentLevel, 'Easy', 'Must clamp at Easy');

  // 8. Fallback ladder
  assert.deepStrictEqual(getDifficultyFallbackLadder('Hard'), ['Hard', 'Medium', 'Easy']);
  assert.deepStrictEqual(getDifficultyFallbackLadder('Medium'), ['Medium', 'Hard', 'Easy']);
  assert.deepStrictEqual(getDifficultyFallbackLadder('Easy'), ['Easy', 'Medium', 'Hard']);

  console.log('✅ Adaptive Ladder tests PASSED!');
}

// Test Bank Distribution
function testBankDistribution() {
  console.log('\nTesting Question Bank 16-Question Mix...');
  const filePath = path.join(__dirname, '../data/questions.json');
  assert(fs.existsSync(filePath), 'questions.json must exist');
  const bank = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  assert(bank.length >= 650, `Expected at least 650 questions, found ${bank.length}`);

  const easy = bank.filter(q => q.difficulty === 'Easy').length;
  const med = bank.filter(q => q.difficulty === 'Medium').length;
  const hard = bank.filter(q => q.difficulty === 'Hard').length;

  console.log(`Bank Stats: Total ${bank.length} Qs | Easy: ${easy} | Medium: ${med} | Hard: ${hard}`);
  assert(easy >= 200, 'Need at least 200 Easy questions');
  assert(med >= 300, 'Need at least 300 Medium questions');
  assert(hard >= 50, 'Need at least 50 Hard questions');

  console.log('✅ Question Bank distribution audit PASSED!');
}

try {
  testProfileLogic();
  testAdaptiveLadder();
  testBankDistribution();
  console.log('\n🎉 ALL ADAPTIVE ENGINE UNIT TESTS PASSED WITH 0 ERRORS!');
  process.exit(0);
} catch (e) {
  console.error('\n❌ UNIT TEST FAILURE:', e);
  process.exit(1);
}
