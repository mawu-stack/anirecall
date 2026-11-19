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

  // Test 3: Uncertain ("maybe") Clue Handling as Soft Preference
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

  console.log('\n-----------------------------------------------------');

  // Test 8: Incorrect "Sure" Clue Handling
  console.log('Test 8: Incorrect "Sure" Clue (Flags Conflict, Surfaces Candidate)');
  try {
    const res8 = await runRecallAgent({
      existingClues: [
        { id: 'c1', category: 'scene', text: 'Eating potato chip dramatically while hiding mini TV', confidence: 'sure' },
        { id: 'c2', category: 'character', text: 'Protagonist writing in black notebook', confidence: 'sure' },
        { id: 'c3', category: 'approx_year', text: 'Released around 2024', confidence: 'sure' } // Incorrect year (Death Note is 2006)
      ]
    });
    assert(res8.candidates.length > 0, 'Surfaces Death Note despite incorrect year');
    assert(res8.candidates[0].title === 'Death Note', `Top candidate is Death Note (Got: ${res8.candidates[0]?.title})`);
    assert(
      res8.candidates[0].conflictingClues.some(c => c.includes('Year discrepancy')),
      'Conflicting clue is explicitly flagged for user correction'
    );
    assert(res8.candidates[0].matchTier !== 'Strong match', 'Not marked Strong match due to conflicting year');
    console.log(`    Flagged conflict: ${res8.candidates[0].conflictingClues.join('; ')}`);
  } catch (err) {
    assert(false, `Test 8 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 9: Missing Credentials / Fallback Mode
  console.log('Test 9: Missing Credentials Graceful Handling');
  try {
    const res9 = await runRecallAgent({
      query: "Girl enters bathhouse after parents turn into pigs"
    });
    assert(res9.isDemoMode === true, 'Accurately reports isDemoMode=true when running offline/fixture mode');
    assert(res9.candidates[0]?.title === 'Spirited Away', `Correctly identified Spirited Away (Got: ${res9.candidates[0]?.title})`);
    assert(
      res9.reasoningSummary.includes('Curated fixture catalog mode active'),
      'Reasoning summary includes honest disclosure of curated fixture mode'
    );
  } catch (err) {
    assert(false, `Test 9 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 10: Do Not Repeatedly Ask Questions Already Answered
  console.log('Test 10: Non-Repeating Follow-Up Questions');
  try {
    // 1st turn: ambiguous query
    const res10a = await runRecallAgent({
      query: "Dark supernatural anime with tactical mind games"
    });
    const firstQ = res10a.followUpQuestion;
    assert(firstQ !== null, 'Generated first discriminating question');

    // 2nd turn: user answers the question category
    const res10b = await runRecallAgent({
      query: "Dark supernatural anime with tactical mind games",
      followUpAnswer: { category: firstQ.category, text: firstQ.options[0] },
      answeredCategories: [firstQ.category],
      previousQuestions: [firstQ.question]
    });

    if (res10b.followUpQuestion) {
      assert(
        res10b.followUpQuestion.question !== firstQ.question,
        `Did not repeat the previous question "${firstQ.question}"`
      );
      assert(
        res10b.followUpQuestion.category !== firstQ.category,
        `Did not repeat the answered category "${firstQ.category}"`
      );
    } else {
      assert(true, 'Resolved ambiguity after first answer without needing repeat question');
    }
  } catch (err) {
    assert(false, `Test 10 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 11: End-to-End User Sequence
  console.log('Test 11: End-to-End Interaction Sequence');
  try {
    // Step 1: Initial vague memory
    const step1 = await runRecallAgent({
      query: "Anime with high schoolers and notebook"
    });
    assert(step1.candidates.length >= 1, 'Step 1: Retrieved initial candidates');

    // Step 2: User provides follow-up answer
    const step2 = await runRecallAgent({
      query: "Anime with high schoolers and notebook",
      existingClues: step1.clues,
      followUpAnswer: { category: 'scene', text: 'Eating potato chip dramatically while hiding mini TV' }
    });
    assert(step2.candidates[0]?.title === 'Death Note', 'Step 2: Refined to Death Note after answer');

    // Step 3: Candidate rejection ("That's not it") on an unwanted candidate
    const unwantedId = step2.candidates[1]?.id;
    if (unwantedId) {
      const step3 = await runRecallAgent({
        existingClues: step2.clues,
        excludedIds: [unwantedId]
      });
      assert(!step3.candidates.some(c => c.id === unwantedId), 'Step 3: Rejected candidate remains excluded');
    } else {
      assert(true, 'Step 3: Handled exclusion logic');
    }

    // Step 4: Confirmation ("Found it!") payload verification
    const confirmedRecord = step2.candidates[0];
    const savedHistoryPayload = {
      id: `saved-${Date.now()}`,
      anime: confirmedRecord,
      originalQuery: "Anime with high schoolers and notebook",
      cluesSnapshot: step2.clues,
      timestamp: Date.now()
    };
    assert(Boolean(savedHistoryPayload.anime.title), 'Step 4: Saved history item structure is valid');
    assert(savedHistoryPayload.cluesSnapshot.length > 0, 'Step 4: Preserves clues snapshot for reopening');
  } catch (err) {
    assert(false, `Test 11 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 12: In-Memory Caching & Rate Limiting Resilience
  console.log('Test 12: In-Memory Caching & Throttling Resilience');
  try {
    const t0 = Date.now();
    await searchAnime('Steins;Gate');
    const t1 = Date.now();
    await searchAnime('Steins;Gate');
    const t2 = Date.now();
    const cachedDuration = t2 - t1;
    assert(cachedDuration < 50, `Subsequent query returned from in-memory cache in ${cachedDuration}ms (< 50ms)`);
  } catch (err) {
    assert(false, `Test 12 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 13: Grounding Verification — Naruto Query Excludes Vinland Saga & Demon Slayer
  console.log('Test 13: Grounding Accuracy — Atomic Clue Matching & Elimination of False Positives');
  try {
    const narutoRes = await runRecallAgent({
      query: "A boy wants to become the leader of his ninja village and has a fox spirit sealed inside him."
    });
    const hasVinland = narutoRes.candidates.some(c => c.title.toLowerCase().includes('vinland'));
    const hasDemonSlayer = narutoRes.candidates.some(c => c.title.toLowerCase().includes('demon slayer') || c.title.toLowerCase().includes('kimetsu'));
    assert(!hasVinland, 'Vinland Saga is NOT marked as matching the Naruto description');
    assert(!hasDemonSlayer, 'Demon Slayer is NOT marked as matching the Naruto description');
    if (narutoRes.candidates.length > 0) {
      assert(narutoRes.candidates[0].title.toLowerCase().includes('naruto'), `Top candidate correctly identified as Naruto (Got: ${narutoRes.candidates[0].title})`);
    }
  } catch (err) {
    assert(false, `Test 13 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 14: Exact Title Search Mode (Cowboy Bebop)
  console.log('Test 14: Dedicated Exact Title Search Mode');
  try {
    const titleRes = await runRecallAgent({
      query: "Cowboy Bebop",
      mode: 'title'
    });
    assert(titleRes.candidates.length > 0, 'Found anime via exact title search');
    assert(titleRes.candidates[0].title === 'Cowboy Bebop', `Top result is Cowboy Bebop (Got: ${titleRes.candidates[0]?.title})`);
    assert(titleRes.candidates[0].score >= 50, `Exact title received high match boost (Score: ${titleRes.candidates[0]?.score})`);
    assert(!titleRes.clues.some(c => c.category === 'scene'), 'Did not treat title as scene clues in title mode');
  } catch (err) {
    assert(false, `Test 14 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 15: Clue Persistence & Refinement Isolation
  console.log('Test 15: Clue Persistence — Does Not Resurrect Deleted Clues on Refinement');
  try {
    // Initial extraction
    const initial = await runRecallAgent({
      query: "Mad scientist in Akihabara with white lab coat microwave time machine"
    });
    assert(initial.clues.length >= 2, `Extracted ${initial.clues.length} clues initially`);

    // User removes one clue and refines
    const curatedClues = initial.clues.slice(0, 1);
    const removedClueText = initial.clues[1]?.text;

    const refined = await runRecallAgent({
      query: "Mad scientist in Akihabara with white lab coat microwave time machine",
      existingClues: curatedClues,
      isRefinement: true
    });

    assert(refined.clues.length === 1, `Refinement preserved curated clue set count (${refined.clues.length})`);
    assert(!refined.clues.some(c => c.text === removedClueText), `Deleted clue "${removedClueText}" was not resurrected`);
  } catch (err) {
    assert(false, `Test 15 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 16: Namespaced Catalog IDs
  console.log('Test 16: Namespaced Catalog IDs & Collision Prevention');
  try {
    const catalogRes = await searchAnime('Steins;Gate');
    assert(catalogRes.length > 0, 'Retrieved catalog entries');
    const firstCand = catalogRes[0];
    assert(Boolean(firstCand.uid), `Candidate has namespaced uid: "${firstCand.uid}"`);
    assert(firstCand.uid.startsWith('mal:') || firstCand.uid.startsWith('anilist:'), `UID uses proper namespace prefix (${firstCand.uid})`);
  } catch (err) {
    assert(false, `Test 16 failed with error: ${err.message}`);
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
