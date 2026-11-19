// lib/agent-core.js
// AniRecall Core Agent: Implements structured tool-calling, clue extraction, candidate retrieval,
// ground-truth candidate comparison, exclusion preservation, and discriminating question generation.

import { searchAnime, getAnimeDetails, searchCharacters } from './anime-catalog.js';
import { callGemini, hasGeminiKey } from './gemini-client.js';
import { VERIFIED_ANIME_FIXTURES } from './fixture-catalog.js';

// Domain entity dictionary for heuristic candidate generation when offline or as pre-filter
const DOMAIN_ENTITY_MAP = [
  { keywords: ['ninja', 'fox spirit', 'nine tails', 'hokage', 'rasengan', 'konoha', 'leaf village', 'shinobi', 'naruto'], titles: ['Naruto', 'Naruto: Shippuuden'] },
  { keywords: ['pirate', 'devil fruit', 'straw hat', 'rubber boy', 'luffy', 'one piece', 'grand line'], titles: ['One Piece'] },
  { keywords: ['titan', 'survey corps', 'walls', 'omni directional', 'eren', 'colossal', 'armin'], titles: ['Shingeki no Kyojin'] },
  { keywords: ['notebook', 'death god', 'black notebook', 'shinigami', 'potato chip', 'kira', 'light yagami', 'death note'], titles: ['Death Note'] },
  { keywords: ['detective', 'mind game', 'tactical mind games', 'investigation', 'police'], titles: ['Death Note', 'Fate/Zero', 'Psycho-Pass'] },
  { keywords: ['supernatural thriller', 'dark supernatural'], titles: ['Fate/Zero', 'Death Note', 'Tokyo Ghoul'] },
  { keywords: ['microwave', 'banana', 'gel banana', 'time travel', 'mad scientist', 'text to past', 'd mail', 'okabe', 'steins'], titles: ['Steins;Gate'] },
  { keywords: ['viking', 'thorfinn', 'askeladd', 'iceland', 'thors', 'vinland'], titles: ['Vinland Saga'] },
  { keywords: ['demon sister', 'bamboo muzzle', 'wooden box', 'tanjiro', 'nezuko', 'sun breathing', 'demon slayer'], titles: ['Kimetsu no Yaiba'] },
  { keywords: ['automail', 'metal arm', 'alchemy', 'philosopher stone', 'elric', 'edward elric', 'brother armor'], titles: ['Fullmetal Alchemist: Brotherhood'] },
  { keywords: ['centipede', 'torture', '1000 minus 7', 'eyepatch mask', 'ghoul', 'kaneki', 'white hair torture'], titles: ['Tokyo Ghoul'] },
  { keywords: ['chainsaw', 'ripcord', 'pochita', 'makima', 'denji'], titles: ['Chainsaw Man'] },
  { keywords: ['saiyan', 'dragon ball', 'kamehameha', 'goku', 'super saiyan'], titles: ['Dragon Ball Z'] },
  { keywords: ['hunter', 'nen', 'killua', 'gon', 'kurapika'], titles: ['Hunter x Hunter (2011)'] },
  { keywords: ['space jazz', 'bounty hunter', 'bebop', 'spike spiegel', 'faye valentine'], titles: ['Cowboy Bebop'] },
  { keywords: ['quirk', 'all might', 'deku', 'superhero academy', 'one for all'], titles: ['Boku no Hero Academia'] },
  { keywords: ['blindfolded teacher', 'cursed finger', 'sukuna', 'gojo', 'jujutsu', 'itadori'], titles: ['Jujutsu Kaisen'] },
  { keywords: ['purple robot', 'purple mecha', 'evangelion', 'shinji', 'unit 01', 'angel attack'], titles: ['Neon Genesis Evangelion'] },
  { keywords: ['bunny girl', 'bunny suit', 'library', 'adolescence syndrome', 'sakuta', 'mai sakurajima'], titles: ['Seishun Buta Yarou wa Bunny Girl Senpai no Yume wo Minai'] },
  { keywords: ['parents turn into pigs', 'spirit bathhouse', 'chihiro', 'haku', 'no face'], titles: ['Sen to Chihiro no Kamikakushi'] },
  { keywords: ['body swap', 'comet', 'twilight', 'mitsuha', 'taki', 'writing on hand'], titles: ['Kimi no Na wa.'] },
  { keywords: ['muskets', 'decapitated', 'candy witch', 'magical girl', 'mami', 'kyubey', 'soul gem'], titles: ['Mahou Shoujo Madoka★Magica'] },
  { keywords: ['volleyball', 'orange hair jump', 'karasuno', 'hinata', 'kageyama'], titles: ['Haikyuu!!'] },
  { keywords: ['telepathic girl', 'peanuts', 'anya', 'forger', 'spy family', 'mind reader'], titles: ['Spy x Family'] },
  { keywords: ['elf white pigtails', 'mimic chest', 'frieren', 'himmel'], titles: ['Sousou no Frieren'] },
  { keywords: ['palmtop tiger', 'wooden sword', 'taiga', 'ryuuji', 'tsundere tiny'], titles: ['Toradora!'] },
  { keywords: ['vampire red coat', 'alucard', 'seras', 'hellsing', 'twin guns'], titles: ['Hellsing Ultimate'] },
  { keywords: ['100 pushups', 'bald hero', 'saitama', 'one punch', 'caped baldy'], titles: ['One Punch Man'] },
  { keywords: ['salt splash', 'reigen', 'mob', 'shigeo', 'bowl cut psychic'], titles: ['Mob Psycho 100'] },
  { keywords: ['neck tattoo', 'orphanage demons', 'conny', 'emma', 'norman', 'ray', 'grace field'], titles: ['Yakusoku no Neverland'] },
  { keywords: ['hand with eyes', 'migi', 'parasite hand', 'shinichi'], titles: ['Kiseijuu: Sei no Kakuritsu'] },
  { keywords: ['dominator', 'crime coefficient', 'akane', 'kogami', 'sibyl system'], titles: ['Psycho-Pass'] }
];

// Simple linguistic stemmer to match singular/plural, past/present variants
function stemWord(word) {
  if (!word || word.length <= 3) return word;
  return word.toLowerCase().replace(/(?:ers|es|s|ing|ed)$/, '');
}

/**
 * Main Agent Orchestration function.
 */
export async function runRecallAgent({
  query = '',
  existingClues = [],
  excludedIds = [],
  followUpAnswer = null,
  mode = 'story',
  answeredCategories = [],
  previousQuestions = [],
  isRefinement = false
}) {
  let providerStatus = hasGeminiKey() ? 'ai_success' : 'missing_credentials';
  const logs = [];

  // Track answered categories
  const activeAnsweredCategories = [...answeredCategories];
  if (followUpAnswer && followUpAnswer.category) {
    activeAnsweredCategories.push(followUpAnswer.category);
  }

  // 1. Tool Call: Clue Extraction & Normalization
  logs.push({ step: 'extract_clues', status: 'started' });
  const extractionResult = await extractCluesTool({
    query,
    existingClues,
    followUpAnswer,
    mode,
    isRefinement
  });
  const clues = extractionResult.clues;
  if (extractionResult.providerStatus) {
    providerStatus = extractionResult.providerStatus;
  }
  logs.push({ step: 'extract_clues', status: 'completed', count: clues.length });

  // 2. Candidate Generation & Search Formulation
  logs.push({ step: 'generate_candidates', status: 'started' });
  let candidateTitles = [];
  if (mode === 'title') {
    candidateTitles = [query.trim()];
  } else {
    candidateTitles = await generateCandidateTitles(query, clues, providerStatus);
  }
  logs.push({ step: 'generate_candidates', generated: candidateTitles });

  const searchQueries = buildSearchQueries(query, clues, mode, candidateTitles);

  // 3. Tool Call: searchAnime across catalog
  logs.push({ step: 'catalog_search', status: 'started' });
  let candidatePool = [];
  const excludedSet = new Set(excludedIds.map(String));

  for (const sq of searchQueries.slice(0, 5)) {
    try {
      const results = await searchAnime(sq.query, sq.filters);
      for (const res of results) {
        const uid = res.uid || `${res.source || 'anilist'}:${res.id}`;
        const isExcluded =
          excludedSet.has(uid) ||
          excludedSet.has(String(res.id)) ||
          (res.malId && excludedSet.has(String(res.malId))) ||
          excludedSet.has(`anilist:${res.id}`) ||
          excludedSet.has(`mal:${res.malId || res.id}`);

        if (!isExcluded && !candidatePool.some(c => (c.uid || c.id) === uid || c.id === res.id)) {
          candidatePool.push({ ...res, uid });
        }
      }
    } catch (e) {
      // Continue with other search queries
    }
  }

  logs.push({ step: 'catalog_search', status: 'completed', candidatesFound: candidatePool.length });

  // 4. Tool Call: getAnimeDetails for top candidates
  logs.push({ step: 'retrieve_details', status: 'started' });
  const detailedCandidates = [];
  for (const cand of candidatePool.slice(0, 10)) {
    try {
      const details = await getAnimeDetails(cand.uid || cand.id);
      detailedCandidates.push(details || cand);
    } catch (e) {
      detailedCandidates.push(cand);
    }
  }
  logs.push({ step: 'retrieve_details', status: 'completed', count: detailedCandidates.length });

  // 5. Tool Call: Unified Grounded Candidate Comparison against Memory Clues
  logs.push({ step: 'compare_candidates', status: 'started' });
  const comparedCandidates = detailedCandidates
    .filter(c => {
      const uid = c.uid || `${c.source || 'anilist'}:${c.id}`;
      return !(
        excludedSet.has(uid) ||
        excludedSet.has(String(c.id)) ||
        (c.malId && excludedSet.has(String(c.malId))) ||
        excludedSet.has(`anilist:${c.id}`) ||
        excludedSet.has(`mal:${c.malId || c.id}`)
      );
    })
    .map(cand => evaluateCandidateAgainstClues(cand, clues, mode, query))
    .sort((a, b) => b.score - a.score);

  logs.push({ step: 'compare_candidates', status: 'completed', totalEvaluated: comparedCandidates.length });

  // Filter candidates based on evidence strength
  let finalCandidates = [];
  if (mode === 'title') {
    finalCandidates = comparedCandidates.filter(c => c.score >= 10).slice(0, 5);
  } else {
    finalCandidates = comparedCandidates
      .filter(c => c.score >= 5 && c.matchingClues.length >= 1)
      .slice(0, 5);
  }

  // 6. Tool Call: Generate Follow-up Discriminating Question
  let followUpQuestion = null;
  if (finalCandidates.length > 1 && mode !== 'title') {
    const topCandidate = finalCandidates[0];
    const secondCandidate = finalCandidates[1];
    const scoreMargin = topCandidate.score - (secondCandidate ? secondCandidate.score : 0);

    // Skip follow-up only if top candidate has a decisive grounded lead
    const isSingleObviousMatch = topCandidate.score >= 20 && scoreMargin >= 10;

    if (!isSingleObviousMatch) {
      followUpQuestion = generateDiscriminatingQuestion(
        finalCandidates,
        clues,
        activeAnsweredCategories,
        previousQuestions
      );
    }
  }

  // 7. Grounded explanation / reasoning summary
  const reasoningSummary = generateReasoningSummary(finalCandidates, clues, providerStatus);

  return {
    clues,
    candidates: finalCandidates,
    followUpQuestion,
    reasoningSummary,
    isDemoMode: providerStatus !== 'ai_success',
    providerStatus,
    answeredCategories: activeAnsweredCategories,
    previousQuestions: followUpQuestion ? [...previousQuestions, followUpQuestion.question] : previousQuestions,
    logs,
    totalEvaluated: detailedCandidates.length
  };
}

/**
 * Extracts and updates structured clues using Gemini or deterministic NLP parsing.
 */
async function extractCluesTool({
  query,
  existingClues = [],
  followUpAnswer = null,
  mode = 'story',
  isRefinement = false
}) {
  let baseClues = [...existingClues];
  let providerStatus = hasGeminiKey() ? 'ai_success' : 'missing_credentials';

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

  // If in title mode, do NOT extract scene clues
  if (mode === 'title') {
    return {
      clues: [{
        id: `clue-title-${Date.now()}`,
        category: 'title',
        text: query.trim(),
        confidence: 'sure'
      }],
      providerStatus
    };
  }

  // If this is a refinement and user already curated clues without adding a new query:
  // PRESERVE curated clues without re-extracting deleted ones from original query!
  if (isRefinement && baseClues.length > 0) {
    return {
      clues: deduplicateClues(baseClues),
      providerStatus
    };
  }

  if (!query && baseClues.length > 0) {
    return {
      clues: deduplicateClues(baseClues),
      providerStatus
    };
  }

  // If live Gemini is enabled, use LLM for semantic extraction
  if (hasGeminiKey() && query.length > 5) {
    try {
      const prompt = `
You are the clue extraction module of AniRecall. Extract memory fragments from this user description into structured clues.
Categories allowed: 'character', 'setting', 'scene', 'genre', 'approx_year', 'watched_year', 'format', 'platform'.

Rules:
1. Distinguish between approx_year (when the anime was released) and watched_year (when the user watched it).
2. Mark confidence as 'sure' if the user sounds certain, or 'maybe' if they say "maybe", "i think", "not sure", "possibly".
3. Extract atomic, specific fragments. Break compound scenes into distinct elements.
4. Keep text concise and informative.

User query: "${query.replace(/"/g, '\\"')}"

Respond ONLY with a JSON array: [{"category": "...", "text": "...", "confidence": "sure"|"maybe"}]
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
        return {
          clues: deduplicateClues([...baseClues, ...extracted]),
          providerStatus: 'ai_success'
        };
      }
    } catch (e) {
      if (e.message && e.message.includes('429')) {
        providerStatus = 'rate_limited';
      } else {
        providerStatus = 'fallback_fixture';
      }
    }
  }

  // Deterministic Rule-Based & Pattern-Matching Extractor
  const extracted = deterministicClueExtractor(query);
  return {
    clues: deduplicateClues([...baseClues, ...extracted]),
    providerStatus
  };
}

/**
 * Candidate generation step: proposes candidate anime titles based on clues/query.
 */
async function generateCandidateTitles(query, clues, providerStatus) {
  const queryLower = query.toLowerCase();
  const proposed = new Set();

  // 1. Check domain entity map for matching high-salience terms
  for (const entry of DOMAIN_ENTITY_MAP) {
    for (const kw of entry.keywords) {
      if (queryLower.includes(kw) || clues.some(c => c.text.toLowerCase().includes(kw))) {
        for (const t of entry.titles) {
          proposed.add(t);
        }
      }
    }
  }

  // 2. If Gemini is active and query is descriptive, ask Gemini for likely titles
  if (providerStatus === 'ai_success' && query.length > 8) {
    try {
      const prompt = `
Given this description of an anime from a user's memory:
"${query.replace(/"/g, '\\"')}"

Suggest up to 4 most likely candidate anime titles (English or Romaji title).
Respond ONLY with a JSON array of title strings: ["Title 1", "Title 2"]
`;
      const resp = await callGemini(prompt, { temperature: 0.1, maxTokens: 120 });
      const titles = JSON.parse(resp.trim());
      if (Array.isArray(titles)) {
        for (const t of titles) {
          if (typeof t === 'string' && t.trim()) proposed.add(t.trim());
        }
      }
    } catch (e) {
      // Continue with heuristic suggestions
    }
  }

  return Array.from(proposed);
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
    { name: 'Psychological / Mystery', rx: /\b(psychological|cat and mouse|detective|investigation|intellectual duel|mind game|tactical mind games)\b/i },
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
    { label: 'Little girl who reads minds with peanut obsession', rx: /\b(anya|reads minds|telepathic girl|horn hair)\b/i },
    { label: 'Ninja with fox spirit sealed inside him', rx: /\b(ninja.*village|fox spirit|sealed inside.*fox|nine tails|hokage)\b/i }
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

  // If no high-level scene matched, extract atomic memory fragments
  if (!clues.some(c => c.category === 'scene')) {
    const cleanedSnippet = text
      .replace(/\b(i remember|i watched|there was an anime|what was that anime|looking for an anime where|an anime about|an anime with)\b/gi, '')
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
function buildSearchQueries(rawQuery, clues, mode, candidateTitles = []) {
  const queries = [];

  // Extract key clues by category
  const scenes = clues.filter(c => c.category === 'scene').map(c => c.text);
  const characters = clues.filter(c => c.category === 'character').map(c => c.text);
  const genres = clues.filter(c => c.category === 'genre').map(c => c.text);
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

  // In Exact Title mode: search directly by title
  if (mode === 'title') {
    queries.push({ query: rawQuery.trim(), filters });
    return queries;
  }

  // Add generated candidate titles first
  for (const t of candidateTitles.slice(0, 3)) {
    queries.push({ query: t, filters });
  }

  // Character search mode
  if (mode === 'character' && characters.length > 0) {
    queries.push({ query: characters[0], filters });
  }

  // Combine top scene keywords
  if (scenes.length > 0) {
    const cleanScene = scenes[0].replace(/[^a-zA-Z0-9\s]/g, ' ').slice(0, 45);
    queries.push({ query: cleanScene, filters });
  }

  if (characters.length > 0 && scenes.length === 0) {
    queries.push({ query: characters[0].slice(0, 40), filters });
  }

  if (genres.length > 0 && queries.length < 3) {
    queries.push({ query: genres[0].replace(/[^a-zA-Z0-9\s]/g, ' '), filters });
  }

  // Direct title/memory search as fallback
  const directWords = rawQuery
    .replace(/\b(i remember|i watched|an anime where|what anime is|there was|something about)\b/gi, '')
    .trim()
    .slice(0, 50);

  if (directWords.length > 2 && queries.length < 4) {
    queries.push({ query: directWords, filters });
  }

  return queries;
}

// Stop words that carry zero discriminative plot power in anime descriptions
const GENERIC_ANIME_STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'under', 'and', 'or',
  'but', 'if', 'because', 'as', 'until', 'while', 'is', 'am', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'should',
  'would', 'may', 'might', 'must', 'will', 'shall', 'it', 'its', 'he', 'him', 'his', 'she',
  'her', 'hers', 'they', 'them', 'their', 'theirs', 'i', 'me', 'my', 'mine', 'you', 'your',
  'yours', 'we', 'us', 'our', 'who', 'whom', 'whose', 'which', 'what', 'this', 'that',
  'these', 'those', 'there', 'here', 'where', 'when', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'anime', 'show', 'series', 'character', 'characters',
  'watched', 'watch', 'remember', 'looking', 'boy', 'girl', 'man', 'woman', 'guy', 'people',
  'person', 'story', 'plot', 'scene', 'wants', 'want', 'become', 'something', 'someone',
  'called', 'known', 'named', 'young', 'life', 'world', 'order', 'good', 'bad'
]);

// High-salience discriminative entities that anchor anime identification
const SALIENT_DISCRIMINATIVE_TERMS = new Set([
  'ninja', 'hokage', 'shinobi', 'fox', 'spirit', 'sealed', 'nine-tails', 'rasengan',
  'viking', 'iceland', 'askeladd', 'thorfinn', 'thors',
  'microwave', 'banana', 'd-mail', 'divergence', 'lab coat', 'akihabara',
  'notebook', 'shinigami', 'potato chip', 'detective', 'kira',
  'ghoul', 'eyepatch', 'centipede', 'torture', '1000',
  'decapitated', 'musket', 'witch', 'soul gem', 'kyubey',
  'bathhouse', 'pig', 'pigs', 'chihiro', 'haku',
  'comet', 'body swap', 'mitsuha', 'taki',
  'bunny', 'library', 'adolescence', 'syndrome',
  'chainsaw', 'ripcord', 'pochita', 'makima',
  'demon', 'sister', 'bamboo', 'muzzle', 'tanjiro',
  'automail', 'alchemy', 'alchemist', 'metal arm',
  'titan', 'walls', 'colossal', 'eren',
  'mecha', 'robot', 'purple', 'evangelion', 'shinji',
  'pirate', 'rubber', 'devil fruit', 'straw hat',
  'volleyball', 'karasuno', 'jump', 'hinata',
  'telepathic', 'peanuts', 'anya', 'spy',
  'orphanage', 'neck', 'tattoo', 'grace field'
]);

/**
 * Unified Grounded Candidate Comparison against structured memory clues.
 * Classifies matching, conflicting, and unverified clues grounded in catalog text.
 * Exported for use in Result Cards, CompareModal, and detail evaluations.
 */
export function evaluateCandidateAgainstClues(cand, clues, mode = 'story', rawQuery = '') {
  let score = 0;
  const matchingClues = [];
  const conflictingClues = [];
  const unverifiedClues = [];

  // Grounding text corpus
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

  // If searchMode is 'title', perform strict title & alias ranking
  if (mode === 'title') {
    const qLower = (rawQuery || '').toLowerCase().trim();
    const candTitleLower = (cand.title || '').toLowerCase().trim();
    const candEngLower = (cand.englishTitle || '').toLowerCase().trim();
    const candRomajiLower = (cand.romajiTitle || '').toLowerCase().trim();

    if (candTitleLower === qLower || candEngLower === qLower || candRomajiLower === qLower) {
      score += 60;
      matchingClues.push(`Exact Title Match: "${cand.title}"`);
    } else if (candTitleLower.startsWith(qLower) || candEngLower.startsWith(qLower)) {
      score += 40;
      matchingClues.push(`Title starts with: "${rawQuery}"`);
    } else if (candidateCorpus.includes(qLower)) {
      score += 20;
      matchingClues.push(`Title / record matches query term`);
    }

    if (cand.format === 'TV' || cand.format === 'Movie') {
      score += 5;
    }

    const matchTier = score >= 50 ? 'Strong match' : (score >= 20 ? 'Possible match' : 'Needs more clues');
    return {
      ...cand,
      score,
      matchTier,
      matchingClues,
      conflictingClues,
      unverifiedClues
    };
  }

  // Memory Clues Evaluation (Story / Scene Mode)
  for (const clue of clues) {
    // 1. Format Clue
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

    // 2. Approximate Release Year Clue
    if (clue.category === 'approx_year') {
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

    // 3. Watched Year Clue
    if (clue.category === 'watched_year') {
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

    // 4. Platform Clue
    if (clue.category === 'platform') {
      const platMatch = clue.text.replace(/Platform:\s*/i, '').trim();
      if (cand.platforms && cand.platforms.length > 0) {
        if (cand.platforms.some(p => p.toLowerCase().includes(platMatch.toLowerCase()))) {
          matchingClues.push(`Available on ${platMatch}`);
          score += 2;
        } else {
          unverifiedClues.push(`Streaming on ${platMatch} not confirmed in record`);
        }
      } else {
        unverifiedClues.push(`Streaming availability not verified for ${platMatch}`);
      }
      continue;
    }

    // 5. Scene, Character, Setting, Genre with Salience & Strict Entity Checking
    const rawTokens = clue.text.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !GENERIC_ANIME_STOP_WORDS.has(t));

    // Identify salient anchor tokens in the clue
    const salientTokensInClue = rawTokens.filter(t => {
      const s = stemWord(t);
      return SALIENT_DISCRIMINATIVE_TERMS.has(t) || SALIENT_DISCRIMINATIVE_TERMS.has(s);
    });

    let tokenMatches = 0;
    let salientMatches = 0;
    for (const token of rawTokens) {
      const stemmed = stemWord(token);
      if (candidateCorpus.includes(token) || candidateCorpus.includes(stemmed)) {
        tokenMatches++;
        if (SALIENT_DISCRIMINATIVE_TERMS.has(token) || SALIENT_DISCRIMINATIVE_TERMS.has(stemmed)) {
          salientMatches++;
        }
      }
    }

    // Salience gate: if clue contains high-salience terms, candidate MUST match at least one salient term!
    const passedSalienceGate = salientTokensInClue.length === 0 || salientMatches >= 1;

    const matchRatio = rawTokens.length > 0 ? tokenMatches / rawTokens.length : 0;

    // Strict multi-token criteria: a 6-word nonsense sentence must NOT match on 1 isolated token
    const isSolidMatch = passedSalienceGate && (
      (rawTokens.length <= 2 && tokenMatches === rawTokens.length && tokenMatches > 0) ||
      (rawTokens.length > 2 && rawTokens.length <= 4 && tokenMatches >= 2 && matchRatio >= 0.5) ||
      (rawTokens.length > 4 && tokenMatches >= 3 && matchRatio >= 0.4) ||
      (salientMatches >= 2 && tokenMatches >= 2)
    );

    const isPartialMatch = !isSolidMatch && passedSalienceGate && (
      (rawTokens.length <= 3 && tokenMatches >= 1 && matchRatio >= 0.33) ||
      (rawTokens.length > 3 && tokenMatches >= 2 && matchRatio >= 0.35)
    );

    if (isSolidMatch) {
      matchingClues.push(`Matches: "${clue.text}"`);
      const sceneBonus = clue.category === 'scene' ? 6 : 0;
      score += (clue.confidence === 'sure' ? 5 : 3) + sceneBonus;
    } else if (isPartialMatch) {
      matchingClues.push(`Partially matches: "${clue.text}"`);
      score += 3;
    } else {
      // If salient words are present in clue but completely missing from candidate
      if (salientTokensInClue.length > 0 && salientMatches === 0 && clue.confidence === 'sure') {
        conflictingClues.push(`Theme mismatch: Missing core elements "${salientTokensInClue.slice(0, 3).join(', ')}" in ${cand.title}`);
        score -= 2;
      } else {
        if (clue.confidence === 'sure') {
          unverifiedClues.push(`Unverified in catalog summary: "${clue.text}"`);
        }
      }
    }
  }

  // Exact title in clues bonus
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
    score: Math.max(0, score),
    matchTier,
    matchingClues,
    conflictingClues,
    unverifiedClues
  };
}

/**
 * Formulates a single discriminating follow-up question with quick answers to distinguish top candidates.
 * Avoids asking for release dates or character names. Focuses on visual scenes, powers, weapons, or settings.
 */
function generateDiscriminatingQuestion(candidates, clues, answeredCategories = [], previousQuestions = []) {
  if (candidates.length < 2) return null;
  const [c1, c2] = candidates;

  const answeredSet = new Set(answeredCategories.map(c => c.toLowerCase()));
  for (const clue of clues) {
    answeredSet.add(clue.category.toLowerCase());
  }

  const prevQuestionSet = new Set(previousQuestions.map(q => q.toLowerCase().trim()));

  // 1. Format difference (TV series vs Animated Movie)
  if (!answeredSet.has('format') && c1.format && c2.format && c1.format !== c2.format) {
    const qText = `Was this a full TV series (${c1.title}) or an animated movie (${c2.title})?`;
    if (!prevQuestionSet.has(qText.toLowerCase())) {
      return {
        id: `q-format-${Date.now()}`,
        category: 'format',
        question: qText,
        options: ['Full TV Series', 'Animated Movie / Feature Film', 'OVA / Special', "I don't remember"]
      };
    }
  }

  // 2. Weapon / Combat / Visual distinction
  if (!answeredSet.has('scene')) {
    const qText = `Between ${c1.title} and ${c2.title}, do you recall any specific weapon, school uniform, or supernatural power?`;
    if (!prevQuestionSet.has(qText.toLowerCase())) {
      return {
        id: `q-scene-${Date.now()}`,
        category: 'scene',
        question: qText,
        options: ['Modern / Realistic weapons', 'Supernatural / Magic powers', 'Mecha / Sci-Fi tech', "I don't remember"]
      };
    }
  }

  // 3. Era / Decade distinction
  if (!answeredSet.has('approx_year') && c1.year && c2.year && Math.abs(c1.year - c2.year) >= 5) {
    const older = c1.year < c2.year ? c1 : c2;
    const newer = c1.year < c2.year ? c2 : c1;
    const qText = `Do you remember if it was an older classic from the ${older.year}s (${older.title}) or a newer release from ${newer.year} (${newer.title})?`;
    if (!prevQuestionSet.has(qText.toLowerCase())) {
      return {
        id: `q-approx_year-${Date.now()}`,
        category: 'approx_year',
        question: qText,
        options: [`Older release around ${older.year}`, `Newer release around ${newer.year}`, "I don't remember"]
      };
    }
  }

  return null;
}

/**
 * Generates an honest, grounded summary of the reasoning loop.
 */
function generateReasoningSummary(candidates, clues, providerStatus) {
  if (candidates.length === 0) {
    return 'No matching anime records found in the catalog matching your current combination of clues. Try describing a specific weapon, setting, or removing restrictive filters in the Clue Manager.';
  }

  const topMatch = candidates[0];
  const strongMatches = candidates.filter(c => c.matchTier === 'Strong match');

  const providerNotes = {
    ai_success: 'Verified via live Google Gemini semantic clue extraction and catalog API grounding.',
    fallback_fixture: 'Evaluated using deterministic rule extraction and verified catalog records. Curated fixture catalog mode active.',
    missing_credentials: 'Operating in Curated Catalog Mode (deterministic NLP extraction grounded in MyAnimeList / AniList metadata). Curated fixture catalog mode active.',
    rate_limited: 'Gemini provider rate limit reached; seamlessly fallen back to deterministic catalog grounding. Curated fixture catalog mode active.'
  };

  const statusNote = providerNotes[providerStatus] || providerNotes.fallback_fixture;

  if (strongMatches.length > 0) {
    return `Identified ${strongMatches.length} strong grounded candidate(s) led by "${topMatch.title}". Matches verified against catalog synopses, characters, and scenes. ${statusNote}`;
  }

  return `Surfaced ${candidates.length} possible candidate(s) based on memory clues. Please answer the discriminating question below or refine clues to narrow the search. ${statusNote}`;
}

// Helper: De-duplicate clues
function deduplicateClues(clues) {
  const seen = new Set();
  const deduped = [];

  for (const c of clues) {
    const key = `${c.category}:${(c.text || '').toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  return deduped;
}
