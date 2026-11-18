// pages/api/mystery/game.js
// Progressive anime guessing game with step-by-step clues and spoiler protection.

import { VERIFIED_ANIME_FIXTURES } from '../../../lib/fixture-catalog.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Pick a random anime from verified fixtures (or specific one by id)
    const { id } = req.query;
    let anime = null;
    if (id) {
      anime = VERIFIED_ANIME_FIXTURES.find(a => String(a.id) === String(id));
    }
    if (!anime) {
      const randomIndex = Math.floor(Math.random() * VERIFIED_ANIME_FIXTURES.length);
      anime = VERIFIED_ANIME_FIXTURES[randomIndex];
    }

    // Build progressive mystery clues
    const roundData = {
      gameId: `${anime.id}-${Date.now()}`,
      animeId: anime.id,
      stages: [
        {
          stage: 1,
          label: 'Era & Format',
          clue: `Released as a ${anime.format} around the year ${anime.year} by studio ${anime.studio}.`,
          difficulty: 'Hard'
        },
        {
          stage: 2,
          label: 'Genres & Themes',
          clue: `Classified under: ${anime.genres.join(', ')}. Key theme tags include: ${anime.tags.slice(0, 3).join(', ')}.`,
          difficulty: 'Medium'
        },
        {
          stage: 3,
          label: 'Character Silhouette',
          clue: `Features a prominent character who is a ${anime.characters[0]?.role || 'Protagonist'} known for: ${anime.characters[0]?.traits?.slice(0, 2).join(', ')}.`,
          difficulty: 'Moderate'
        },
        {
          stage: 4,
          label: 'Iconic Scene Fragment (No Major Spoilers)',
          clue: `A memorable scene involves: "${anime.scenes[0] || 'A pivotal confrontation altering character destinies'}".`,
          difficulty: 'Easy'
        },
        {
          stage: 5,
          label: 'Spoiler Clue (Warning: Major Plot Twist)',
          clue: anime.spoilerExplanation || 'The climactic revelation turns the entire premise on its head.',
          isSpoiler: true,
          difficulty: 'Dead Giveaway'
        }
      ],
      // For verification when user submits a guess
      answerSummary: {
        title: anime.title,
        englishTitle: anime.englishTitle,
        year: anime.year,
        posterUrl: anime.posterUrl,
        sourceUrl: anime.sourceUrl,
        synopsis: anime.synopsis
      }
    };

    return res.status(200).json({
      success: true,
      data: roundData
    });
  }

  return res.status(405).json({ error: 'Method not allowed. Use GET.' });
}
