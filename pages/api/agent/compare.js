// pages/api/agent/compare.js
// Side-by-side candidate comparison endpoint using the unified grounded clue evaluation function.

import { getAnimeDetails } from '../../../lib/anime-catalog.js';
import { evaluateCandidateAgainstClues } from '../../../lib/agent-core.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { id1, id2, clues = [] } = req.body || {};

    if (!id1 || !id2) {
      return res.status(400).json({ error: 'Both id1 and id2 are required for comparison.' });
    }

    const [anime1Raw, anime2Raw] = await Promise.all([
      getAnimeDetails(id1),
      getAnimeDetails(id2)
    ]);

    if (!anime1Raw || !anime2Raw) {
      return res.status(404).json({ error: 'One or both anime records could not be found.' });
    }

    // Run unified evaluation against user's memory clues
    const eval1 = evaluateCandidateAgainstClues(anime1Raw, clues);
    const eval2 = evaluateCandidateAgainstClues(anime2Raw, clues);

    // Build comparison matrix
    const comparison = {
      anime1: {
        id: eval1.id,
        uid: eval1.uid,
        title: eval1.title,
        englishTitle: eval1.englishTitle,
        year: eval1.year || 'Unknown',
        format: eval1.format || 'Unknown',
        episodes: eval1.episodes || 'Unknown',
        studio: eval1.studio || 'Unknown',
        genres: eval1.genres || [],
        posterUrl: eval1.posterUrl,
        sourceUrl: eval1.sourceUrl,
        synopsis: eval1.synopsis,
        score: eval1.score,
        matchTier: eval1.matchTier,
        matchingClues: eval1.matchingClues,
        conflictingClues: eval1.conflictingClues
      },
      anime2: {
        id: eval2.id,
        uid: eval2.uid,
        title: eval2.title,
        englishTitle: eval2.englishTitle,
        year: eval2.year || 'Unknown',
        format: eval2.format || 'Unknown',
        episodes: eval2.episodes || 'Unknown',
        studio: eval2.studio || 'Unknown',
        genres: eval2.genres || [],
        posterUrl: eval2.posterUrl,
        sourceUrl: eval2.sourceUrl,
        synopsis: eval2.synopsis,
        score: eval2.score,
        matchTier: eval2.matchTier,
        matchingClues: eval2.matchingClues,
        conflictingClues: eval2.conflictingClues
      },
      clueBreakdown: clues.map(clue => {
        const isMatch1 = eval1.matchingClues.some(m => m.includes(clue.text));
        const isConflict1 = eval1.conflictingClues.some(c => c.includes(clue.text) || c.includes(candFormatSnippet(clue, eval1)));

        const isMatch2 = eval2.matchingClues.some(m => m.includes(clue.text));
        const isConflict2 = eval2.conflictingClues.some(c => c.includes(clue.text) || c.includes(candFormatSnippet(clue, eval2)));

        return {
          clueText: clue.text,
          category: clue.category,
          statusAnime1: isMatch1 ? 'Matches' : (isConflict1 ? 'Conflicts' : 'Unverified'),
          statusAnime2: isMatch2 ? 'Matches' : (isConflict2 ? 'Conflicts' : 'Unverified')
        };
      }),
      distinguishingQuestion: buildDistinguishingQuestion(eval1, eval2)
    };

    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (err) {
    console.error('Comparison error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to compare candidates.'
    });
  }
}

function candFormatSnippet(clue, cand) {
  if (clue.category === 'format') return cand.format || '';
  if (clue.category === 'approx_year') return String(cand.year || '');
  return '';
}

function buildDistinguishingQuestion(a1, a2) {
  if (a1.format !== a2.format) {
    return `Was this a full multi-episode TV series (${a1.format === 'TV' ? a1.title : a2.title}) or an animated movie (${a1.format === 'Movie' ? a1.title : a2.title})?`;
  }
  if (a1.year && a2.year && Math.abs(a1.year - a2.year) > 4) {
    return `Was it released in ${a1.year} (${a1.title}) or in ${a2.year} (${a2.title})?`;
  }
  return `Between "${a1.title}" and "${a2.title}", do you remember the main setting or distinct powers?`;
}
