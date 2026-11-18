// pages/api/agent/character.js
// Dedicated character finder API endpoint.

import { searchCharacters, getAnimeDetails } from '../../../lib/anime-catalog.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { query = '' } = req.body || {};

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    if (query.length > 500) {
      return res.status(400).json({ error: 'Character query too long (max 500 characters).' });
    }

    const characters = await searchCharacters(query.trim());

    // Enrich characters with anime metadata if needed
    const enriched = await Promise.all(
      characters.slice(0, 8).map(async (char) => {
        if (char.animeId && !char.posterUrl) {
          const details = await getAnimeDetails(char.animeId);
          if (details) {
            return {
              ...char,
              posterUrl: details.posterUrl,
              sourceUrl: details.sourceUrl,
              year: details.year,
              format: details.format
            };
          }
        }
        return char;
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        characters: enriched,
        count: enriched.length
      }
    });
  } catch (err) {
    console.error('Character search error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to search characters.'
    });
  }
}
