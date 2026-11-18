// scripts/run-tests.js
// Verification test suite for AniRecall agent, tools, clue extractor, ranking, exclusions, and follow-ups.

import { runRecallAgent } from '../lib/agent-core.js';
import { searchAnime, getAnimeDetails, searchCharacters } from '../lib/anime-catalog.js';
import { VERIFIED_ANIME_FIXTURES } from '../lib/fixture-catalog.js';

let passedCount = 0;
let failedCount = 0;
const testResults = [];

function assert(condition, message) {
  if (condition) {
    passedCount++;
    testResults.push({ status: 'PASS', message });
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedCount++;
    testResults.push({ status: 'FAIL', message });
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runAllTests() {
  console.log('=====================================================');
  console.log('       ANIRECALL AUTOMATED VERIFICATION SUITE         ');
  console.log('=====================================================\n');

  // Test 1: Recognizable Plot Description
  console.log('Test 1: Recognizable Plot Description (Steins;Gate)');
  try {
    const res1 = await runRecallAgent({
      query: "A mad scientist in Akihabara puts green bananas in a modified microwave and sends text messages to the past"
    });
    assert(res1.candidates.length > 0, 'Found at least one candidate');
    assert(res1.candidates[0].title === 'Steins;Gate', `Top candidate is Steins;Gate (Got: ${res1.candidates[0]?.title})`);
    assert(res1.candidates[0].matchTier === 'Strong match', `Match tier is 'Strong match' (Got: ${res1.candidates[0]?.matchTier})`);
    assert(res1.clues.some(c => c.category === 'scene'), 'Extracted scene clue');
    console.log(`    Matching clues: ${res1.candidates[0].matchingClues.join('; ')}`);
  } catch (err) {
    assert(false, `Test 1 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 2: Ambiguous Description Requiring a Follow-up
  console.log('Test 2: Ambiguous Description Requiring a Follow-Up Question');
  try {
    const res2 = await runRecallAgent({
      query: "Supernatural thriller series with dark mind games and detectives"
    });
    assert(res2.candidates.length > 1, `Retrieved multiple candidates for ambiguous query (${res2.candidates.length} candidates)`);
    assert(res2.followUpQuestion !== null, 'Follow-up discriminating question was generated');
    assert(res2.followUpQuestion?.options?.length >= 2, `Question has quick-answer options (${res2.followUpQuestion?.options?.join(', ')})`);
    console.log(`    Question asked: "${res2.followUpQuestion?.question}"`);
  } catch (err) {
    assert(false, `Test 2 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 3: Incorrect or Uncertain Clue Handling
  console.log('Test 3: Uncertain ("maybe") Clue Handling as Soft Preference');
  try {
    const res3 = await runRecallAgent({
      query: "There was a girl in a bunny suit in a library, maybe released around 2022?"
    });
    assert(res3.candidates.length > 0, 'Found candidate despite date uncertainty');
    assert(
      res3.candidates[0].title.includes('Bunny Girl Senpai') || res3.candidates[0].title.includes('Seishun Buta'),
      `Correctly identified Bunny Girl Senpai despite uncertain year (Got: ${res3.candidates[0]?.title})`
    );
    const yearClue = res3.clues.find(c => c.category === 'approx_year');
    assert(yearClue && yearClue.confidence === 'maybe', 'Year clue was marked with "maybe" confidence');
  } catch (err) {
    assert(false, `Test 3 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 4: Candidate Rejection ("That's not it") & Refinement
  console.log('Test 4: Candidate Rejection ("That\'s not it") & Exclusion');
  try {
    const initialRes = await runRecallAgent({
      query: "High school boy with supernatural power and dark psychological themes"
    });
    const firstTop = initialRes.candidates[0];

    // Exclude the top candidate
    const refinedRes = await runRecallAgent({
      query: "High school boy with supernatural power and dark psychological themes",
      excludedIds: [firstTop.id]
    });

    assert(
      !refinedRes.candidates.some(c => c.id === firstTop.id),
      `Excluded candidate ${firstTop.title} (ID: ${firstTop.id}) is absent from refined pool`
    );
    assert(refinedRes.candidates.length > 0, 'Next alternative candidate was promoted');
  } catch (err) {
    assert(false, `Test 4 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 5: Character-based Query
  console.log('Test 5: Character Finder Mode (Appearance & Traits)');
  try {
    const charResults = await searchCharacters("white hair eyepatch centipede torture");
    assert(charResults.length > 0, `Found matching characters (${charResults.length})`);
    const kaneki = charResults.find(c => c.name.includes('Kaneki') || c.animeTitle.includes('Tokyo Ghoul'));
    assert(Boolean(kaneki), `Matched Ken Kaneki / Tokyo Ghoul (Found: ${charResults[0]?.name})`);
    assert(kaneki?.animeTitle === 'Tokyo Ghoul', `Verified anime association is Tokyo Ghoul (Got: ${kaneki?.animeTitle})`);
  } catch (err) {
    assert(false, `Test 5 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 6: No-Match Case
  console.log('Test 6: No-Match / Obscure Case');
  try {
    const res6 = await runRecallAgent({
      query: "xyz789 completely non-existent anime with purple flying tractors in space eating cheese"
    });
    assert(res6.candidates.length === 0, `Returned 0 candidates for ungrounded nonsense query (Got: ${res6.candidates.length})`);
    assert(
      res6.reasoningSummary.toLowerCase().includes('no matching anime records found'),
      'Honest reasoning summary stating no grounded records match'
    );
  } catch (err) {
    assert(false, `Test 6 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 7: Watched Year vs Release Year Distinction
  console.log('Test 7: Watched Year vs Release Year Distinction');
  try {
    const res7 = await runRecallAgent({
      query: "I watched it in 2021 on Netflix but it was an older 90s mecha show with a boy in a purple robot"
    });
    const watchedClue = res7.clues.find(c => c.category === 'watched_year');
    const releaseClue = res7.clues.find(c => c.category === 'approx_year');
    assert(Boolean(watchedClue), `Extracted watched_year clue: "${watchedClue?.text}"`);
    assert(Boolean(releaseClue), `Extracted release_year clue: "${releaseClue?.text}"`);
    assert(res7.candidates[0]?.title.includes('Evangelion'), `Matched Neon Genesis Evangelion (Got: ${res7.candidates[0]?.title})`);
  } catch (err) {
    assert(false, `Test 7 failed with error: ${err.message}`);
  }

  console.log('\n=====================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('=====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch(e => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
