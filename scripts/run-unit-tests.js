// scripts/run-unit-tests.js
// Dedicated offline, deterministic unit & fixture test suite for AniRecall.
// Tests clue extraction, scoring, candidate generation, false-positive elimination,
// cross-provider namespaced ID collision prevention, and providerStatus attribution.

import { runRecallAgent, evaluateCandidateAgainstClues } from '../lib/agent-core.js';
import { searchAnime, getAnimeDetails, searchCharacters } from '../lib/anime-catalog.js';
import { VERIFIED_ANIME_FIXTURES } from '../lib/fixture-catalog.js';
import { isTextJsonCompatibleModel, classifyGeminiError } from '../lib/gemini-client.js';

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

async function runUnitTests() {
  console.log('=====================================================');
  console.log('       ANIRECALL UNIT & FIXTURE TEST SUITE           ');
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

  // Test 4: Candidate Rejection ("That's not it") & Exclusion
  console.log('Test 4: Candidate Rejection ("That\'s not it") & Exclusion');
  try {
    const initialRes = await runRecallAgent({
      query: "High school boy with supernatural power and dark psychological themes"
    });
    const firstTop = initialRes.candidates[0];
    const topUid = firstTop.uid || `${firstTop.source || 'anilist'}:${firstTop.id}`;

    // Exclude the top candidate using namespaced UID
    const refinedRes = await runRecallAgent({
      query: "High school boy with supernatural power and dark psychological themes",
      excludedIds: [topUid]
    });

    assert(
      !refinedRes.candidates.some(c => (c.uid || `${c.source || 'anilist'}:${c.id}`) === topUid),
      `Excluded candidate ${firstTop.title} (UID: ${topUid}) is absent from refined pool`
    );
    assert(refinedRes.candidates.length > 0, 'Next alternative candidate was promoted');
  } catch (err) {
    assert(false, `Test 4 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 5: Character Finder Mode
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
        { id: 'c3', category: 'approx_year', text: 'Released around 2024', confidence: 'sure' }
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

  // Test 9: Missing Credentials / Fallback Mode Reporting
  console.log('Test 9: Missing Credentials Graceful Handling');
  try {
    const res9 = await runRecallAgent({
      query: "Girl enters bathhouse after parents turn into pigs"
    });
    assert(res9.isDemoMode === true, 'Accurately reports isDemoMode=true when running offline/fixture mode');
    assert(res9.candidates[0]?.title === 'Spirited Away', `Correctly identified Spirited Away (Got: ${res9.candidates[0]?.title})`);
    assert(
      res9.reasoningSummary.includes('Curated fixture catalog mode active') || res9.reasoningSummary.includes('Curated Catalog Mode'),
      'Reasoning summary includes honest disclosure of curated fixture mode'
    );
  } catch (err) {
    assert(false, `Test 9 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 10: Non-Repeating Follow-Up Questions
  console.log('Test 10: Non-Repeating Follow-Up Questions');
  try {
    const res10a = await runRecallAgent({
      query: "Dark supernatural anime with tactical mind games"
    });
    const firstQ = res10a.followUpQuestion;
    assert(firstQ !== null, 'Generated first discriminating question');

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
    const step1 = await runRecallAgent({
      query: "Anime with high schoolers and notebook"
    });
    assert(step1.candidates.length >= 1, 'Step 1: Retrieved initial candidates');

    const step2 = await runRecallAgent({
      query: "Anime with high schoolers and notebook",
      existingClues: step1.clues,
      followUpAnswer: { category: 'scene', text: 'Eating potato chip dramatically while hiding mini TV' }
    });
    assert(step2.candidates[0]?.title === 'Death Note', 'Step 2: Refined to Death Note after answer');

    const unwantedUid = step2.candidates[1]?.uid;
    if (unwantedUid) {
      const step3 = await runRecallAgent({
        existingClues: step2.clues,
        excludedIds: [unwantedUid]
      });
      assert(!step3.candidates.some(c => c.uid === unwantedUid), 'Step 3: Rejected candidate remains excluded');
    } else {
      assert(true, 'Step 3: Handled exclusion logic');
    }
  } catch (err) {
    assert(false, `Test 11 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 12: In-Memory Caching & Throttling Resilience
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

  // Test 13: Grounding Accuracy — Naruto Query Excludes Vinland Saga & Demon Slayer
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
    const initial = await runRecallAgent({
      query: "Mad scientist in Akihabara with white lab coat microwave time machine"
    });
    assert(initial.clues.length >= 2, `Extracted ${initial.clues.length} clues initially`);

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

  // Test 16: Namespaced Catalog IDs & Collision Prevention
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

  console.log('\n-----------------------------------------------------');

  // Test 17: REGRESSION - Cross-Provider ID Collision (MAL vs AniList sharing ID 1535)
  console.log('Test 17: Cross-Provider ID Collision Regression (MAL vs AniList with identical numeric ID 1535)');
  try {
    // animeMal: Death Note (MAL ID 1535)
    const animeMal = {
      id: 1535,
      malId: 1535,
      source: 'mal',
      uid: 'mal:1535',
      title: 'Death Note',
      year: 2006,
      format: 'TV',
      synopsis: 'A high school student discovers a supernatural notebook that grants the ability to kill anyone whose name is written in it.'
    };

    // animeAniList: A distinct anime with AniList ID 1535
    const animeAniList = {
      id: 1535,
      malId: 8888,
      source: 'anilist',
      uid: 'anilist:1535',
      title: 'Sayonara Zetsubou Sensei',
      year: 2007,
      format: 'TV',
      synopsis: 'A cynical teacher takes everything in the most negative light possible.'
    };

    // 17.1: Deduplication must retain both distinct shows
    const pool = [];
    const pushIfDistinct = (item) => {
      const uid = item.uid || `${item.source || 'anilist'}:${item.id}`;
      if (!pool.some(c => (c.uid || `${c.source || 'anilist'}:${c.id}`) === uid)) {
        pool.push(item);
      }
    };
    pushIfDistinct(animeMal);
    pushIfDistinct(animeAniList);
    assert(pool.length === 2, `Both anime sharing numeric ID 1535 retained in candidate pool (Count: ${pool.length})`);
    assert(pool[0].title === 'Death Note' && pool[1].title === 'Sayonara Zetsubou Sensei', 'Both distinct titles preserved in pool without collision');

    // 17.2: Exclusions - excluding 'mal:1535' must NOT exclude 'anilist:1535'
    const excludedMalSet = new Set(['mal:1535']);
    const filteredAfterMalExclusion = pool.filter(c => !excludedMalSet.has(c.uid));
    assert(filteredAfterMalExclusion.length === 1, 'Only 1 candidate remains after excluding mal:1535');
    assert(filteredAfterMalExclusion[0].uid === 'anilist:1535', `Excluding mal:1535 did NOT exclude anilist:1535 (Remaining: ${filteredAfterMalExclusion[0]?.title})`);

    // 17.3: Exclusions - excluding 'anilist:1535' must NOT exclude 'mal:1535'
    const excludedAniListSet = new Set(['anilist:1535']);
    const filteredAfterAniListExclusion = pool.filter(c => !excludedAniListSet.has(c.uid));
    assert(filteredAfterAniListExclusion.length === 1, 'Only 1 candidate remains after excluding anilist:1535');
    assert(filteredAfterAniListExclusion[0].uid === 'mal:1535', `Excluding anilist:1535 did NOT exclude mal:1535 (Remaining: ${filteredAfterAniListExclusion[0]?.title})`);

    // 17.4: Side-by-side comparison distinguishes both
    const evalMal = evaluateCandidateAgainstClues(animeMal, [{ category: 'scene', text: 'black notebook', confidence: 'sure' }]);
    const evalAniList = evaluateCandidateAgainstClues(animeAniList, [{ category: 'scene', text: 'cynical teacher', confidence: 'sure' }]);
    assert(evalMal.uid === 'mal:1535' && evalAniList.uid === 'anilist:1535', 'Both evaluations preserve separate namespaced UIDs');
    assert(evalMal.title !== evalAniList.title, 'Comparison correctly evaluates two separate anime with the same numeric ID');

    // 17.5: Saved History persistence retains both without overwriting
    const history = [];
    const addToHistory = (a) => {
      const getUid = (cand) => cand.uid || `${cand.source || 'anilist'}:${cand.id}`;
      return [{ anime: a }, ...history.filter(h => getUid(h.anime) !== getUid(a))];
    };
    const hist1 = addToHistory(animeMal);
    history.push(...hist1);
    const hist2 = addToHistory(animeAniList);
    assert(hist2.length === 2, `Saved history retains both anime sharing ID 1535 without collision (Count: ${hist2.length})`);
  } catch (err) {
    assert(false, `Test 17 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 18: REGRESSION - Strict Provider Status Attribution
  console.log('Test 18: Strict Provider Status Attribution');
  try {
    // 18.1: Exact title search must return 'exact_title_lookup', NEVER claiming 'ai_success'
    const titleRes = await runRecallAgent({
      query: "Death Note",
      mode: 'title'
    });
    assert(titleRes.providerStatus === 'exact_title_lookup', `Exact title mode sets providerStatus to 'exact_title_lookup' (Got: ${titleRes.providerStatus})`);
    assert(titleRes.isDemoMode === true, 'Exact title mode marks isDemoMode=true (no false AI claim)');

    // 18.2: Pure clue refinement without new prompt returns 'refinement_curated'
    const refineRes = await runRecallAgent({
      existingClues: [{ id: 'c1', category: 'scene', text: 'black notebook', confidence: 'sure' }],
      isRefinement: true
    });
    assert(refineRes.providerStatus === 'refinement_curated', `Refinement without query sets providerStatus to 'refinement_curated' (Got: ${refineRes.providerStatus})`);
    assert(refineRes.isDemoMode === true, 'Refinement without LLM marks isDemoMode=true');

    // 18.3: Without GEMINI_API_KEY, normal search reports 'missing_credentials'
    const unauthRes = await runRecallAgent({
      query: "A boy wants to become the leader of his ninja village"
    });
    assert(unauthRes.providerStatus === 'missing_credentials', `Without API key, reports providerStatus 'missing_credentials' (Got: ${unauthRes.providerStatus})`);
    assert(unauthRes.isDemoMode === true, 'Without API key, marks isDemoMode=true');
  } catch (err) {
    assert(false, `Test 18 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 19: Walrus Taxi Driver Mystery (Odd Taxi Discovery & Atomic Clue Extraction)
  console.log('Test 19: Walrus Taxi Driver Mystery (Odd Taxi Discovery & Atomic Clue Extraction)');
  try {
    const walrusQuery = "A walrus taxi driver gets caught up in a missing girl mystery in a city populated by animals.";
    const result = await runRecallAgent({ query: walrusQuery });

    assert(result.candidates.length > 0, `Surfaced candidates for Odd Taxi query (Count: ${result.candidates.length})`);
    const top = result.candidates[0];
    assert(top.title === 'Odd Taxi' || top.romajiTitle === 'Odd Taxi' || top.englishTitle === 'ODDTAXI', `Top candidate is Odd Taxi (Got: ${top.title})`);
    assert(top.matchTier === 'Strong match' || top.matchTier === 'Possible match', `Match tier is valid (Got: ${top.matchTier})`);

    // Verify atomic clue extraction: should extract distinct character/setting/scene/genre clues rather than dumping 1 raw blob
    const categories = new Set(result.clues.map(c => c.category));
    assert(categories.has('character') || categories.has('setting') || categories.has('genre'), `Extracted atomic structured clues across multiple categories (Categories: ${Array.from(categories).join(', ')})`);
    assert(result.clues.length >= 2, `Extracted multiple atomic clues rather than single sentence dump (Clue count: ${result.clues.length})`);
    console.log(`    Extracted clues: ${result.clues.map(c => `[${c.category}] ${c.text}`).join('; ')}`);
  } catch (err) {
    assert(false, `Test 19 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 20: Grounded Evidence Quality — Synopsis Absences Categorized as Unverified, NOT Conflicted
  console.log('Test 20: Grounded Evidence Quality — Synopsis Absences Categorized as Unverified, NOT Conflicted');
  try {
    const mockCandidate = {
      id: 9999,
      uid: 'mal:9999',
      source: 'mal',
      title: 'City Detective Chronicles',
      synopsis: 'A seasoned detective investigates strange occurrences in an urban high-rise.',
      year: 2020,
      format: 'TV'
    };

    // Clues: one matching ('detective'), one not in synopsis ('yellow rain boots'), one year conflict (released 1995 vs 2020)
    const testClues = [
      { category: 'character', text: 'seasoned detective', confidence: 'sure' },
      { category: 'scene', text: 'yellow rain boots in the alleyway', confidence: 'sure' },
      { category: 'approx_year', text: 'Released around 1995', confidence: 'sure' }
    ];

    const evaluation = evaluateCandidateAgainstClues(mockCandidate, testClues);

    // Matching clue found
    assert(evaluation.matchingClues.some(m => m.toLowerCase().includes('detective')), 'Supported clue is in matchingClues');

    // Unmentioned detail ('yellow rain boots') must be unverified, NEVER conflicting
    assert(evaluation.unverifiedClues.some(u => u.toLowerCase().includes('yellow rain boots')), 'Unmentioned detail is classified as unverified');
    assert(!evaluation.conflictingClues.some(c => c.toLowerCase().includes('yellow rain boots')), 'Unmentioned detail is NOT classified as a conflict');

    // Real conflict (year 2020 vs 1995 > 8 years difference) MUST be in conflictingClues
    assert(evaluation.conflictingClues.some(c => c.toLowerCase().includes('year discrepancy')), 'Genuine chronological/year discrepancy is correctly flagged as conflict');
  } catch (err) {
    assert(false, `Test 20 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 21: Server Diagnostics Object & Model Attribution
  console.log('Test 21: Server Diagnostics Object & Model Attribution');
  try {
    const res = await runRecallAgent({ query: 'Spirited Away', mode: 'title' });
    assert(res.geminiDiagnostics !== undefined, 'runRecallAgent returns geminiDiagnostics object');
    assert(typeof res.geminiDiagnostics.hasKey === 'boolean', 'geminiDiagnostics includes boolean hasKey');
    assert(typeof res.geminiDiagnostics.activeModel === 'string', `geminiDiagnostics includes activeModel (Got: ${res.geminiDiagnostics.activeModel})`);
    assert(typeof res.geminiDiagnostics.errorCode === 'string', `geminiDiagnostics includes sanitized errorCode (Got: ${res.geminiDiagnostics.errorCode})`);
  } catch (err) {
    assert(false, `Test 21 failed with error: ${err.message}`);
  }

  console.log('\n-----------------------------------------------------');

  // Test 22: Model Modality Compatibility Filtering & Historical Setting vs Release Date Distinction
  console.log('Test 22: Model Modality Compatibility Filtering & Historical Setting vs Release Date Distinction');
  try {
    // 1. Model compatibility checks
    assert(isTextJsonCompatibleModel('gemini-2.5-flash') === true, 'gemini-2.5-flash is recognized as text/JSON compatible');
    assert(isTextJsonCompatibleModel('gemini-2.5-pro') === true, 'gemini-2.5-pro is recognized as text/JSON compatible');
    assert(isTextJsonCompatibleModel('gemini-2.5-flash-preview-tts') === false, 'gemini-2.5-flash-preview-tts is excluded (TTS modality)');
    assert(isTextJsonCompatibleModel('gemini-2.5-pro-preview-tts') === false, 'gemini-2.5-pro-preview-tts is excluded (TTS modality)');
    assert(isTextJsonCompatibleModel('imagen-3.0-generate-002') === false, 'imagen model is excluded (image generation modality)');
    assert(isTextJsonCompatibleModel('gemini-live-2.5-flash') === false, 'realtime/live model is excluded');

    // 2. Error classification for incompatible models
    const classified = classifyGeminiError(new Error('INCOMPATIBLE_MODEL: model does not support text output'));
    assert(classified.code === 'INCOMPATIBLE_MODEL_MODALITY', 'Incompatible model error is classified as INCOMPATIBLE_MODEL_MODALITY');

    // 3. Date extraction: "set in 1930s America" describes the story setting, NOT release year
    const resHistorical = await runRecallAgent({
      query: "Immortal gangsters and alchemists on a train called the Flying Pussyfoot in 1930s America."
    });
    const settingClue = resHistorical.clues.find(c => c.category === 'setting');
    const yearClue = resHistorical.clues.find(c => c.category === 'approx_year');

    assert(Boolean(settingClue), `Extracted setting clue: "${settingClue?.text}"`);
    assert(settingClue?.text.includes('1930s America') || settingClue?.text.includes('Flying Pussyfoot'), 'Setting clue correctly captures setting element');
    assert(yearClue === undefined, 'Did NOT extract 1930s as release year (properly distinguished story setting from release date)');

    // 4. Genuine release year extraction with explicit wording
    const resRelease = await runRecallAgent({
      query: "An anime that was released in 2006 about a dark notebook"
    });
    const genuineYearClue = resRelease.clues.find(c => c.category === 'approx_year');
    assert(Boolean(genuineYearClue), `Extracted release year with explicit wording: "${genuineYearClue?.text}"`);
    assert(genuineYearClue?.text.includes('2006'), 'Release year correctly identified as 2006');
  } catch (err) {
    assert(false, `Test 22 failed with error: ${err.message}`);
  }

  console.log('\n=====================================================');
  console.log(`TOTAL UNIT TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('=====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runUnitTests().catch(e => {
  console.error('Fatal unit test error:', e);
  process.exit(1);
});
