// pages/api/agent/vibes.js
// Generates verified recommendations with similar vibes (setting, themes, tone, character dynamics).

import { getAnimeDetails, searchAnime } from '../../../lib/anime-catalog.js';
import { VERIFIED_ANIME_FIXTURES } from '../../../lib/fixture-catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { animeId, selectedVibe = 'tone' } = req.body || {};

    if (!animeId) {
      return res.status(400).json({ error: 'animeId is required.' });
    }

    const currentAnime = await getAnimeDetails(animeId);
    if (!currentAnime) {
      return res.status(404).json({ error: 'Anime not found.' });
    }

    // Filter potential recommendations from verified catalog, excluding the current anime
    const currentIdStr = String(currentAnime.id);
    const candidates = VERIFIED_ANIME_FIXTURES.filter(
      f => String(f.id) !== currentIdStr && f.title !== currentAnime.title
    );

    const scoredRecommendations = candidates.map(rec => {
      let score = 0;
      let connection = '';

      // Match shared genres
      const currentGenres = new Set(currentAnime.genres || []);
      const sharedGenres = (rec.genres || []).filter(g => currentGenres.has(g));
      score += sharedGenres.length * 3;

      // Match tone and tags
      const currentTags = new Set(currentAnime.tags || []);
      const sharedTags = (rec.tags || []).filter(t => currentTags.has(t));
      score += sharedTags.length * 4;

      if (selectedVibe === 'setting') {
        const isSciFi = currentGenres.has('Sci-Fi') && rec.genres.includes('Sci-Fi');
        const isFantasy = currentGenres.has('Fantasy') && rec.genres.includes('Fantasy');
        if (isSciFi) {
          score += 5;
          connection = `Shares high-concept science-fiction worldbuilding and technological atmosphere.`;
        } else if (isFantasy) {
          score += 5;
          connection = `Features expansive world exploration and intricate supernatural power systems.`;
        } else {
          connection = `Similar setting and societal backdrop with intense character stakes.`;
        }
      } else if (selectedVibe === 'tone') {
        const isDark = (currentGenres.has('Psychological') || currentGenres.has('Suspense')) &&
                       (rec.genres.includes('Psychological') || rec.genres.includes('Suspense'));
        const isEmotional = currentGenres.has('Drama') && rec.genres.includes('Drama');
        if (isDark) {
          score += 6;
          connection = `Captures the same dark psychological tension, high-stakes moral dilemmas, and gripping suspense.`;
        } else if (isEmotional) {
          score += 5;
          connection = `Matches the deeply emotional character storytelling and poignant emotional resonance.`;
        } else {
          connection = `Shares a compelling narrative momentum and tonal pacing.`;
        }
      } else if (selectedVibe === 'character') {
        score += 4;
        connection = `Features similarly complex, multifaceted protagonists confronting overwhelming obstacles.`;
      } else {
        connection = `Shares genre hallmarks in ${sharedGenres.slice(0, 2).join(' & ')} with memorable key sequences.`;
      }

      return {
        id: rec.id,
        title: rec.title,
        year: rec.year,
        format: rec.format,
        studio: rec.studio,
        genres: rec.genres,
        posterUrl: rec.posterUrl,
        sourceUrl: rec.sourceUrl,
        synopsis: rec.synopsis,
        connectionExplanation: connection,
        score
      };
    });

    const recommendations = scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    return res.status(200).json({
      success: true,
      data: {
        sourceAnime: {
          id: currentAnime.id,
          title: currentAnime.title,
          posterUrl: currentAnime.posterUrl
        },
        selectedVibe,
        recommendations
      }
    });
  } catch (err) {
    console.error('Similar vibes error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error generating similar vibes.'
    });
  }
}
