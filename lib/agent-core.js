// lib/agent-core.js
// AniRecall Core Agent: Implements structured tool-calling, clue extraction, candidate retrieval,
// ground-truth candidate comparison, exclusion preservation, and discriminating question generation.

import { searchAnime, getAnimeDetails, searchCharacters } from './anime-catalog.js';
import { callGemini, hasGeminiKey } from './gemini-client.js';
import { VERIFIED_ANIME_FIXTURES } from './fixture-catalog.js';

/**
 * Main Agent Orchestration function.
 * @param {object} input
 * @param {string} input.query - Raw user query or memory description
 * @param {Array} input.existingClues - Array of existing clues { id, category, text, confidence }
 * @param {Array} input.excludedIds - Array of anime IDs marked "That's not it"
 * @param {object} input.followUpAnswer - User's answer to previous follow-up question
 * @param {string} input.mode - 'story' or 'character' or 'title'
 */
export async function runRecallAgent({
  query = '',
  existingClues = [],
  excludedIds = [],
  followUpAnswer = null,
  mode = 'story'
}) {
  const isDemo = !hasGeminiKey();
  const logs = [];

  // 1. Tool Call: Clue Extraction & Normalization
  logs.push({ step: 'extract_clues', status: 'started' });
  let clues = await extractCluesTool(query, existingClues, followUpAnswer, isDemo);
  logs.push({ step: 'extract_clues', status: 'completed', count: clues.length });

  // 2. Formulate Search Queries based on extracted clues & query
  logs.push({ step: 'formulate_queries', status: 'started' });
  const searchQueries = buildSearchQueries(query, clues, mode);
  logs.push({ step: 'formulate_queries', queries: searchQueries });

  // 3. Tool Call: searchAnime across catalog
  logs.push({ step: 'catalog_search', status: 'started' });
  let candidatePool = [];
  const seenIds = new Set(excludedIds.map(id => String(id)));

  for (const sq of searchQueries.slice(0, 3)) {
    try {
      const results = await searchAnime(sq.query, sq.filters);
      for (const res of results) {
        if (!seenIds.has(String(res.id)) && !seenIds.has(String(res.malId))) {
          seenIds.add(String(res.id));
          seenIds.add(String(res.malId));
          candidatePool.push(res);
        }
      }
    } catch (e) {
      // Ignore individual search errors, continue with pool
    }
  }

  // If pool is empty, attempt a relaxed search on key keywords
  if (candidatePool.length === 0 && searchQueries.length > 0) {
    const fallbackResults = await searchAnime(searchQueries[0].query);
    candidatePool = fallbackResults.filter(r => !seenIds.has(String(r.id)));
  }

  logs.push({ step: 'catalog_search', status: 'completed', candidatesFound: candidatePool.length });

  // 4. Tool Call: getAnimeDetails for top candidates
  logs.push({ step: 'retrieve_details', status: 'started' });
  const detailedCandidates = [];
  for (const cand of candidatePool.slice(0, 8)) {
    const details = await getAnimeDetails(cand.id);
    detailedCandidates.push(details || cand);
  }
  logs.push({ step: 'retrieve_details', status: 'completed', count: detailedCandidates.length });

  // 5. Tool Call: compareCandidates - Grounded comparison against extracted memory clues
  logs.push({ step: 'compare_candidates', status: 'started' });
  const comparedCandidates = compareCandidatesAgainstClues(detailedCandidates, clues, excludedIds);
  logs.push({ step: 'compare_candidates', status: 'completed', qualified: comparedCandidates.length });

  // Sort and filter qualified candidates
  const finalCandidates = comparedCandidates
    .filter(c => c.score >= 5 && c.matchingClues.length >= 1)
    .slice(0, 5);

  // 6. Tool Call: Generate Follow-up Discriminating Question
  let followUpQuestion = null;
  if (finalCandidates.length > 1) {
    const isSingleObviousMatch = finalCandidates.length === 1 ||
      (finalCandidates[0].score >= 20 && (finalCandidates[0].score - (finalCandidates[1]?.score || 0) >= 10));

    if (!isSingleObviousMatch) {
      followUpQuestion = generateDiscriminatingQuestion(finalCandidates, clues);
    }
  }

  // 7. Grounded explanation / reasoning summary
  const reasoningSummary = generateReasoningSummary(finalCandidates, clues, isDemo);

  return {
    clues,
    candidates: finalCandidates,
    followUpQuestion,
    reasoningSummary,
    isDemoMode: isDemo,
    logs,
    totalEvaluated: detailedCandidates.length
  };
}

/**
 * Extracts and updates structured clues using Gemini or deterministic NLP parsing.
 */
async function extractCluesTool(query, existingClues = [], followUpAnswer = null, isDemo = false) {
  // If we already have existing clues and user only provided a follow-up answer or minor edit
  let baseClues = [...existingClues];

  // Process follow-up answer if provided
  if (followUpAnswer && followUpAnswer.text && followUpAnswer.text.toLowerCase() !== "i don't remember") {
    const newClue = {
      id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: followUpAnswer.category || 'scene',
      text: followUpAnswer.text,
      confidence: 'sure'
    };
    baseClues.push(newClue);
  }

  if (!query && baseClues.length > 0) {
    return deduplicateClues(baseClues);
  }

  // If live Gemini is enabled, use LLM for semantic extraction
  if (!isDemo && query.length > 5) {
    try {
      const prompt = `
You are the clue extraction module of AniRecall. Extract all memory fragments from this user description into structured clues.
Categories allowed: 'character', 'setting', 'scene', 'genre', 'approx_year', 'watched_year', 'format', 'platform'.

Rules:
1. Distinguish between approx_year (when the anime was released, e.g., "came out in 2006", "90s anime") and watched_year (when the user watched it, e.g., "I watched it in 2018 on Netflix").
2. Mark confidence as 'sure' if the user sounds certain, or 'maybe' if they say "maybe", "i think", "not sure", "either X or Y".
3. Keep text concise and informative.

User query: "${query.replace(/"/g, '\\"')}"

Respond ONLY with a JSON array of objects: [{"category": "...", "text": "...", "confidence": "sure"|"maybe"}]
`;
      const geminiResponse = await callGemini(prompt, { temperature: 0.1 });
      const parsed = JSON.parse(geminiResponse.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        const extracted = parsed.map((c, i) => ({
          id: `clue-${Date.now()}-${i}`,
          category: c.category || 'scene',
          text: c.text,
          confidence: c.confidence === 'maybe' ? 'maybe' : 'sure'
        }));
        return deduplicateClues([...baseClues, ...extracted]);
      }
    } catch (e) {
      // Fall through to deterministic extractor
    }
  }

  // Deterministic Rule-Based & Pattern-Matching Extractor
  const extracted = deterministicClueExtractor(query);
  return deduplicateClues([...baseClues, ...extracted]);
}

/**
 * Robust rule-based clue extractor handling years, formats, platforms, settings, and scenes.
 */
function deterministicClueExtractor(rawText) {
  const text = (rawText || '').trim();
  if (!text) return [];

  const clues = [];
  let counter = 0;
  const addClue = (category, clueText, confidence = 'sure') => {
    clues.push({
      id: `clue-${Date.now()}-${counter++}`,
      category,
      text: clueText,
      confidence
    });
  };

  const isUncertain = /\b(maybe|perhaps|not sure|i think|possibly|might have been|could be)\b/i.test(text);
  const defaultConfidence = isUncertain ? 'maybe' : 'sure';

  // 1. Watched Year vs Release Year patterns
  const watchedMatch = text.match(/\b(watched|saw|viewed)\s+(it\s+)?(around\s+|in\s+)?(19\d\d|20\d\d)\b/i);
  if (watchedMatch) {
    addClue('watched_year', `Watched around ${watchedMatch[4]}`, 'sure');
  }

  // Decade patterns: 90s, 80s, 2000s, 2010s
  const decadeMatch = text.match(/\b(older\s+|classic\s+)?(19\d0s|20\d0s|90s|80s|2000s|2010s)\b/i);
  const releaseMatch = text.match(/\b(came out|released|from the|made in|aired in)\s+(the\s+)?(early\s+|late\s+|mid\s+)?(19\d0s|20\d0s|19\d\d|20\d\d)\b/i);

  if (releaseMatch) {
    addClue('approx_year', `Released around ${releaseMatch[4]}`, defaultConfidence);
  } else if (decadeMatch) {
    const rawDecade = decadeMatch[2].toLowerCase();
    let normDecade = rawDecade;
    if (rawDecade === '90s') normDecade = '1990s';
    if (rawDecade === '80s') normDecade = '1980s';
    addClue('approx_year', `Released in the ${normDecade}`, defaultConfidence);
  } else {
    // Lone year mention like "around 2011" or "2006"
    const loneYear = text.match(/\b(in|around|circa|year)?\s*(199\d|200\d|201\d|202\d)\b/i);
    if (loneYear && !watchedMatch) {
      addClue('approx_year', `Era: ${loneYear[2]}`, defaultConfidence);
    }
  }

  // 2. Format: Movie vs Series vs OVA
  if (/\b(movie|film|theatrical)\b/i.test(text)) {
    addClue('format', 'Format: Movie / Film', defaultConfidence);
  } else if (/\b(series|show|episodes|season 1|season 2|anime series)\b/i.test(text)) {
    addClue('format', 'Format: TV Series', defaultConfidence);
  } else if (/\b(ova|special|short film)\b/i.test(text)) {
    addClue('format', 'Format: OVA / Special', defaultConfidence);
  }

  // 3. Platform
  const platforms = ['Netflix', 'Crunchyroll', 'Hulu', 'Funimation', 'Amazon Prime', 'YouTube', 'Toonami', 'Adult Swim', 'DVD', 'VHS'];
  for (const plat of platforms) {
    const rx = new RegExp(`\\b${plat}\\b`, 'i');
    if (rx.test(text)) {
      addClue('platform', `Platform: ${plat}`, 'sure');
    }
  }

  // 4. Genre indicators
  const genrePatterns = [
    { name: 'Sci-Fi / Time Travel', rx: /\b(time travel|time machine|microwave|timeline|butterfly effect|sci-fi|future gadget)\b/i },
    { name: 'Psychological / Mystery', rx: /\b(psychological|cat and mouse|detective|investigation|intellectual duel|mind game)\b/i },
    { name: 'Supernatural / Magic', rx: /\b(magical girl|witch|shinigami|soul gem|demon|curse|cursed|vampire|ghoul|supernatural|alchemist|alchemy)\b/i },
    { name: 'Cyberpunk / Dystopian', rx: /\b(cyberpunk|cyborg|dominator|crime coefficient|sandevistan|prosthetic|night city|dystopia)\b/i },
    { name: 'Romance / Drama', rx: /\b(romance|body swap|love letter|tsundere|high school crush|violin|piano)\b/i },
    { name: 'Mecha / Giant Robot', rx: /\b(mecha|giant robot|evangelion|pilot|drills)\b/i },
    { name: 'Dark Fantasy / Horror', rx: /\b(dark fantasy|eclipse|huge sword|flesh eating|eyepatch|torture|behelit)\b/i }
  ];

  for (const gp of genrePatterns) {
    if (gp.rx.test(text)) {
      addClue('genre', gp.name, defaultConfidence);
    }
  }

  // 5. Distinctive Character descriptions
  const characterTraits = [
    { label: 'Scientist in white lab coat', rx: /\b(lab coat|mad scientist|scientist with coat)\b/i },
    { label: 'Boy with eyepatch / white hair', rx: /\b(eyepatch|white hair.*torture|ghoul)\b/i },
    { label: 'Protagonist writing in black notebook', rx: /\b(black notebook|death notebook|shinigami|eating potato chip)\b/i },
    { label: 'Deaf girl with notebook or hearing aids', rx: /\b(deaf girl|sign language|hearing aids|blue x's)\b/i },
    { label: 'White cat-like rabbit creature offering contracts', rx: /\b(kyubey|cat creature|rabbit creature|magical girl contract|wish)\b/i },
    { label: 'Blindfolded white-haired teacher', rx: /\b(blindfold|blindfolded|white hair.*teacher|gojo|six eyes)\b/i },
    { label: 'Short blonde boy with mechanical automail limbs', rx: /\b(automail|metal arm|suit of armor brother|short blonde)\b/i },
    { label: 'Elf with white twin pigtails', rx: /\b(elf|frieren|mimic chest|white pigtails)\b/i },
    { label: 'Vampire in red coat and fedora with twin guns', rx: /\b(vampire in red|alucard|hellsing)\b/i },
    { label: 'Short girl called Palmtop Tiger with wooden sword', rx: /\b(palmtop tiger|wooden sword|tsundere tiny)\b/i },
    { label: 'Short jumper with orange hair playing volleyball', rx: /\b(volleyball|orange hair.*jump|karasuno)\b/i },
    { label: 'Little girl who reads minds with peanut obsession', rx: /\b(anya|reads minds|telepathic girl|horn hair)\b/i }
  ];

  for (const ct of characterTraits) {
    if (ct.rx.test(text)) {
      addClue('character', ct.label, 'sure');
    }
  }

  // 6. Distinctive Scene / Plot fragments
  const scenePatterns = [
    { label: 'Boy piloting purple cyborg mecha / robot Unit-01', rx: /\b(purple robot|purple mecha|get in the robot|evangelion|shinji)\b/i },
    { label: 'Putting green bananas in modified microwave to turn them into gel', rx: /\b(microwave|gel banana|green banana|d-mail|text to the past)\b/i },
    { label: 'Eating potato chip dramatically while hiding mini TV', rx: /\b(potato chip|take a potato chip|tennis match.*rival)\b/i },
    { label: 'Magical girl mentor decapitated by candy witch in episode 3', rx: /\b(head bitten off|decapitated|episode 3.*witch|mami)\b/i },
    { label: 'Parents transformed into giant pigs at abandoned food stalls', rx: /\b(parents.*pigs|bathhouse|train on water|no face)\b/i },
    { label: 'Body swapping between rural girl and Tokyo boy with comet', rx: /\b(body swap|twilight.*crater|comet split|writing on hand)\b/i },
    { label: 'Tortured on checkered floor counting backwards from 1000 by 7', rx: /\b(counting backwards|1000.*7|centipede in ear|white hair)\b/i },
    { label: 'Girl wearing bunny suit in public library unnoticed', rx: /\b(bunny suit.*library|bunny girl.*library|adolescence syndrome)\b/i },
    { label: 'Orphanage where children have neck tattoos raised for demons', rx: /\b(neck tattoo|orphanage.*demons|flower in chest|conny)\b/i },
    { label: 'Sprouting roaring chainsaw blades from head and arms via chest ripcord', rx: /\b(chainsaw.*head|ripcord.*chest|makima)\b/i },
    { label: 'Hand with eyes and mouth that transforms into razor blades', rx: /\b(hand with eyes|migi|parasite.*hand|right hand)\b/i },
    { label: 'Dominator weapon expanding suspect like balloon', rx: /\b(dominator|crime coefficient|lethal eliminator)\b/i },
    { label: 'Boy carrying demon sister in wooden backpack box', rx: /\b(wooden box|bamboo muzzle|tanjiro|nezuko|sun breathing)\b/i },
    { label: '100 pushups, 100 situps, 10km run until hair falls out', rx: /\b(100 pushups|caped baldy|one punch|bald hero)\b/i },
    { label: 'Con artist throwing grocery salt at ghosts screaming Salt Splash', rx: /\b(reigen|salt splash|mob.*100%|bowl cut psychic)\b/i }
  ];

  for (const sp of scenePatterns) {
    if (sp.rx.test(text)) {
      addClue('scene', sp.label, 'sure');
    }
  }

  // If no high-level scene/character matched, extract the core memory chunk as scene
  if (clues.length === 0 || (!clues.some(c => c.category === 'scene') && !clues.some(c => c.category === 'character'))) {
    const cleanedSnippet = text
      .replace(/\b(i remember|i watched|there was an anime|what was that anime|looking for an anime where)\b/gi, '')
      .trim();
    if (cleanedSnippet.length > 3) {
      addClue('scene', cleanedSnippet.slice(0, 100), defaultConfidence);
    }
  }

  return clues;
}

/**
 * Builds specific targeted search queries for the anime catalog.
 */
function buildSearchQueries(rawQuery, clues, mode) {
  const queries = [];

  // Extract key clues by category
  const scenes = clues.filter(c => c.category === 'scene').map(c => c.text);
  const characters = clues.filter(c => c.category === 'character').map(c => c.text);
  const approxYear = clues.find(c => c.category === 'approx_year');
  const formatClue = clues.find(c => c.category === 'format');

  const filters = {};
  if (approxYear && approxYear.confidence === 'sure') {
    const yMatch = approxYear.text.match(/\b(19\d\d|20\d\d)\b/);
    if (yMatch) filters.year = yMatch[1];
  }
  if (formatClue && formatClue.confidence === 'sure') {
    if (/movie/i.test(formatClue.text)) filters.format = 'Movie';
    else if (/series|tv/i.test(formatClue.text)) filters.format = 'TV';
  }

  // Mode: Character search mode
  if (mode === 'character' && characters.length > 0) {
    queries.push({ query: characters[0], filters });
  }

  // Combine top scene/character keywords
  if (scenes.length > 0) {
    const cleanScene = scenes[0].replace(/[^a-zA-Z0-9\s]/g, ' ').slice(0, 45);
    queries.push({ query: cleanScene, filters });
  }

  if (characters.length > 0 && scenes.length === 0) {
    queries.push({ query: characters[0].slice(0, 40), filters });
  }

  // Direct title/memory search as fallback
  const directWords = rawQuery
    .replace(/\b(i remember|i watched|an anime where|what anime is|there was|something about)\b/gi, '')
    .trim()
    .slice(0, 50);

  if (directWords.length > 2) {
    queries.push({ query: directWords, filters });
  }

  return queries;
}

/**
 * Compares candidate anime against user's structured clues.
 * Classifies matching, conflicting, and unverified clues grounded in catalog text.
 */
function compareCandidatesAgainstClues(candidates, clues, excludedIds = []) {
  const excludedSet = new Set(excludedIds.map(String));

  return candidates
    .filter(c => !excludedSet.has(String(c.id)) && !excludedSet.has(String(c.malId)))
    .map(cand => {
      let score = 0;
      const matchingClues = [];
      const conflictingClues = [];
      const unverifiedClues = [];

      // Grounding text corpus: title, synopsis, genres, studio, tags, scenes, characters
      const candidateCorpus = [
        cand.title || '',
        cand.englishTitle || '',
        cand.romajiTitle || '',
        cand.synopsis || '',
        cand.studio || '',
        ...(cand.genres || []),
        ...(cand.tags || []),
        ...(cand.scenes || []),
        ...(cand.platforms || []),
        ...(cand.characters || []).map(c => `${c.name || ''} ${c.alias || ''} ${(c.traits || []).join(' ')}`)
      ].join(' ').toLowerCase();

      for (const clue of clues) {
        const clueLower = clue.text.toLowerCase();
        const STOP_WORDS = new Set(['anime', 'show', 'series', 'character', 'characters', 'watched', 'watch', 'remember', 'looking', 'there', 'about', 'where', 'with', 'from', 'into', 'that', 'this', 'have', 'been']);
        const tokens = clueLower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2 && !STOP_WORDS.has(t));

        if (clue.category === 'format') {
          const isMovieClue = /movie|film/i.test(clue.text);
          const isSeriesClue = /series|tv/i.test(clue.text);
          const candFormat = (cand.format || '').toLowerCase();

          if ((isMovieClue && candFormat.includes('movie')) || (isSeriesClue && (candFormat.includes('tv') || candFormat.includes('series')))) {
            matchingClues.push(`Format matches: ${cand.format}`);
            score += 3;
          } else if ((isMovieClue && candFormat.includes('tv')) || (isSeriesClue && candFormat.includes('movie'))) {
            conflictingClues.push(`Format conflict: User specified ${clue.text}, but this is a ${cand.format}`);
            score -= (clue.confidence === 'sure' ? 3 : 1);
          }
          continue;
        }

        if (clue.category === 'approx_year') {
          // Decade match like 1990s or 2010s
          const decMatch = clue.text.match(/\b(19\d0s|20\d0s)\b/);
          if (decMatch && cand.year) {
            const decStart = Number(decMatch[1].slice(0, 4));
            if (cand.year >= decStart && cand.year < decStart + 10) {
              matchingClues.push(`Era matches: ${cand.year} (${decMatch[1]})`);
              score += 5;
              continue;
            }
          }

          const yMatch = clue.text.match(/\b(19\d\d|20\d\d)\b/);
          if (yMatch && cand.year) {
            const yearNum = Number(yMatch[1]);
            const diff = Math.abs(cand.year - yearNum);
            if (diff <= 1) {
              matchingClues.push(`Release year matches: ${cand.year}`);
              score += 4;
            } else if (diff <= 3) {
              matchingClues.push(`Release year close: ${cand.year} (around ${yearNum})`);
              score += 2;
            } else if (diff > 8 && clue.confidence === 'sure') {
              conflictingClues.push(`Year discrepancy: Released in ${cand.year}, but clue noted ${clue.text}`);
              score -= 2;
            } else {
              unverifiedClues.push(`Year ${cand.year} differs from ${clue.text}`);
            }
          }
          continue;
        }

        if (clue.category === 'watched_year') {
          // Watched year is when the user saw it; it cannot conflict unless anime released after that year
          const yMatch = clue.text.match(/\b(19\d\d|20\d\d)\b/);
          if (yMatch && cand.year) {
            const watchedYear = Number(yMatch[1]);
            if (cand.year > watchedYear) {
              conflictingClues.push(`Chronology conflict: Released in ${cand.year}, after user watched in ${watchedYear}`);
              score -= 3;
            } else {
              matchingClues.push(`Plausible timeline: Released ${cand.year}, watched around ${watchedYear}`);
              score += 1;
            }
          }
          continue;
        }

        // Scene, Character, Setting, Genre token checks
        let tokenMatches = 0;
        for (const token of tokens) {
          if (candidateCorpus.includes(token)) {
            tokenMatches++;
          }
        }

        const matchRatio = tokens.length > 0 ? tokenMatches / tokens.length : 0;
        const isMatch = (tokens.length <= 3 && tokenMatches === tokens.length && tokenMatches > 0) ||
                        (tokens.length > 3 && matchRatio >= 0.5) ||
                        (tokenMatches >= 4 && matchRatio >= 0.4);

        const isPartial = !isMatch && (tokenMatches >= 2 && matchRatio >= 0.35);

        if (isMatch) {
          matchingClues.push(`Matches: "${clue.text}"`);
          const sceneBonus = clue.category === 'scene' ? 6 : 0;
          score += (clue.confidence === 'sure' ? 5 : 3) + sceneBonus;
        } else if (isPartial) {
          matchingClues.push(`Partially matches: "${clue.text}"`);
          score += 3;
        } else {
          // If the clue is specific and not found in catalog summary
          if (clue.confidence === 'sure') {
            unverifiedClues.push(`Unverified in catalog summary: "${clue.text}"`);
          }
        }
      }

      // Title exact match bonus
      for (const clue of clues) {
        if (cand.title.toLowerCase().includes(clue.text.toLowerCase()) ||
            (cand.englishTitle && cand.englishTitle.toLowerCase().includes(clue.text.toLowerCase()))) {
          score += 8;
        }
      }

      // Determine match tier label
      let matchTier = 'Needs more clues';
      if (score >= 10 && matchingClues.length >= 2 && conflictingClues.length === 0) {
        matchTier = 'Strong match';
      } else if (score >= 5 || matchingClues.length >= 1) {
        matchTier = 'Possible match';
      }

      return {
        ...cand,
        score,
        matchTier,
        matchingClues,
        conflictingClues,
        unverifiedClues
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Formulates a single discriminating follow-up question with quick answers to distinguish top candidates.
 */
function generateDiscriminatingQuestion(candidates, clues) {
  if (candidates.length < 2) return null;
  const [c1, c2] = candidates;

  // 1. Format difference (TV series vs Movie)
  if (c1.format && c2.format && c1.format !== c2.format) {
    return {
      category: 'format',
      question: `Was this a full TV series (${c1.title}) or an animated movie (${c2.title})?`,
      options: ['Full TV Series', 'Standalone Movie', "I don't remember"]
    };
  }

  // 2. Era difference (e.g. 1990s/2000s vs 2010s/2020s)
  if (c1.year && c2.year && Math.abs(c1.year - c2.year) >= 6) {
    const older = c1.year < c2.year ? c1 : c2;
    const newer = c1.year > c2.year ? c1 : c2;
    return {
      category: 'approx_year',
      question: `Do you remember if it was an older classic from the ${Math.floor(older.year / 10) * 10}s (${older.title}) or a newer release from ${newer.year} (${newer.title})?`,
      options: [`Older (${Math.floor(older.year / 10) * 10}s)`, `Newer (~${newer.year})`, "I don't remember"]
    };
  }

  // 3. Setting / Theme difference
  const g1 = (c1.genres || [])[0] || 'Action';
  const g2 = (c2.genres || [])[0] || 'Drama';
  if (g1 !== g2) {
    return {
      category: 'genre',
      question: `Did the plot lean more toward ${g1} elements (${c1.title}) or ${g2} elements (${c2.title})?`,
      options: [g1, g2, 'Both / Neither', "I don't remember"]
    };
  }

  // 4. Fallback distinguishing question
  return {
    category: 'scene',
    question: `Between ${c1.title} and ${c2.title}, do you recall any specific weapon, school uniform, or supernatural power?`,
    options: ['Modern / Realistic weapons', 'Supernatural / Magic powers', 'Mecha / Sci-Fi tech', "I don't remember"]
  };
}

/**
 * Generates an honest, grounded reasoning summary for the current search state.
 */
function generateReasoningSummary(candidates, clues, isDemo) {
  if (candidates.length === 0) {
    return "No matching anime records found in the verified catalog for these exact clues. Try removing uncertain clues or describing a specific character trait, setting, or memorable scene.";
  }

  const top = candidates[0];
  const count = candidates.length;
  let text = `Evaluated candidate catalog records based on ${clues.length} extracted memory clues. `;

  if (top.matchTier === 'Strong match') {
    text += `Found strong alignment with "${top.title}" (${top.year}, ${top.format}) matching key plot and character details.`;
  } else if (top.matchTier === 'Possible match') {
    text += `Identified ${count} plausible candidate${count > 1 ? 's' : ''}, with "${top.title}" matching several recalled elements. Clarifying additional clues will narrow down the exact title.`;
  } else {
    text += `Current candidates have partial overlap. More specific clues (such as characters, setting, or ending) are recommended to confirm the match.`;
  }

  if (isDemo) {
    text += " [Curated fixture catalog mode active]";
  }

  return text;
}

// Deduplicate clues by text similarity
function deduplicateClues(clues) {
  const seen = new Set();
  const result = [];
  for (const c of clues) {
    const key = `${c.category}:${c.text.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(c);
    }
  }
  return result;
}
