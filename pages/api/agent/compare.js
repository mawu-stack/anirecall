// pages/api/agent/compare.js
// Side-by-side candidate comparison endpoint.

import { getAnimeDetails } from '../../../lib/anime-catalog.js';

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

    const [anime1, anime2] = await Promise.all([
      getAnimeDetails(id1),
      getAnimeDetails(id2)
    ]);

    if (!anime1 || !anime2) {
      return res.status(404).json({ error: 'One or both anime records could not be found.' });
    }

    // Build comparison matrix
    const comparison = {
      anime1: {
        id: anime1.id,
        title: anime1.title,
        year: anime1.year || 'Unknown',
        format: anime1.format || 'Unknown',
        episodes: anime1.episodes || 'Unknown',
        studio: anime1.studio || 'Unknown',
        genres: anime1.genres || [],
        posterUrl: anime1.posterUrl,
        sourceUrl: anime1.sourceUrl,
        synopsis: anime1.synopsis
      },
      anime2: {
        id: anime2.id,
        title: anime2.title,
        year: anime2.year || 'Unknown',
        format: anime2.format || 'Unknown',
        episodes: anime2.episodes || 'Unknown',
        studio: anime2.studio || 'Unknown',
        genres: anime2.genres || [],
        posterUrl: anime2.posterUrl,
        sourceUrl: anime2.sourceUrl,
        synopsis: anime2.synopsis
      },
      clueBreakdown: clues.map(clue => {
        const textLower = clue.text.toLowerCase();
        const corpus1 = [anime1.title, anime1.synopsis, ...(anime1.genres || []), ...(anime1.scenes || [])].join(' ').toLowerCase();
        const corpus2 = [anime2.title, anime2.synopsis, ...(anime2.genres || []), ...(anime2.scenes || [])].join(' ').toLowerCase();

        const match1 = corpus1.includes(textLower) || checkTokens(textLower, corpus1);
        const match2 = corpus2.includes(textLower) || checkTokens(textLower, corpus2);

        return {
          clueText: clue.text,
          category: clue.category,
          statusAnime1: match1 ? 'Matches' : 'Unverified in synopsis',
          statusAnime2: match2 ? 'Matches' : 'Unverified in synopsis'
        };
      }),
      distinguishingQuestion: buildDistinguishingQuestion(anime1, anime2)
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

function checkTokens(phrase, text) {
  const tokens = phrase.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 3);
  if (tokens.length === 0) return false;
  let matches = 0;
  for (const t of tokens) {
    if (text.includes(t)) matches++;
  }
  return matches >= Math.ceil(tokens.length * 0.6);
}

function buildDistinguishingQuestion(a1, a2) {
  if (a1.format !== a2.format) {
    return `Did you watch a standalone ${a1.format} or a episodic ${a2.format}?`;
  }
  if (a1.year && a2.year && Math.abs(a1.year - a2.year) > 4) {
    return `Was it released in ${a1.year} (${a1.title}) or in ${a2.year} (${a2.title})?`;
  }
  const g1 = (a1.genres || [])[0] || 'Action';
  const g2 = (a2.genres || [])[0] || 'Drama';
  if (g1 !== g2) {
    return `Was the primary focus on ${g1} elements or ${g2} elements?`;
  }
  return `Do you remember if the protagonist was associated with "${a1.characters?.[0]?.name || a1.title}" or "${a2.characters?.[0]?.name || a2.title}"?`;
}
