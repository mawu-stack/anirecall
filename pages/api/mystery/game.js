// pages/api/mystery/game.js
// Progressive anime guessing game with step-by-step clues and server-side guess validation.
// Answers are strictly validated server-side to prevent client-side answer leakage.

import { VERIFIED_ANIME_FIXTURES } from '../../../lib/fixture-catalog.js';

export default async function handler(req, res) {
  // GET: Start a new mystery game without exposing the answer
  if (req.method === 'GET') {
    const { id } = req.query;
    let anime = null;
    if (id) {
      anime = VERIFIED_ANIME_FIXTURES.find(a => String(a.id) === String(id));
    }
    if (!anime) {
      const randomIndex = Math.floor(Math.random() * VERIFIED_ANIME_FIXTURES.length);
      anime = VERIFIED_ANIME_FIXTURES[randomIndex];
    }

    // Build progressive mystery clues (without answerSummary or title!)
    const roundData = {
      gameId: `${anime.id}-${Date.now()}`,
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
      ]
    };

    return res.status(200).json({
      success: true,
      data: roundData
    });
  }

  // POST: Validate user guess or reveal on give-up
  if (req.method === 'POST') {
    const { gameId, guess, giveUp = false } = req.body || {};

    if (!gameId) {
      return res.status(400).json({ error: 'gameId is required.' });
    }

    const animeId = gameId.split('-')[0];
    const anime = VERIFIED_ANIME_FIXTURES.find(a => String(a.id) === String(animeId));

    if (!anime) {
      return res.status(404).json({ error: 'Game session expired or not found.' });
    }

    const answerSummary = {
      title: anime.title,
      englishTitle: anime.englishTitle,
      year: anime.year,
      posterUrl: anime.posterUrl,
      sourceUrl: anime.sourceUrl,
      synopsis: anime.synopsis
    };

    if (giveUp) {
      return res.status(200).json({
        success: true,
        correct: false,
        gaveUp: true,
        answerSummary
      });
    }

    if (!guess || typeof guess !== 'string' || !guess.trim()) {
      return res.status(400).json({ error: 'Please enter a guess.' });
    }

    const normGuess = guess.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const normTitle = anime.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normEnglish = (anime.englishTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normRomaji = (anime.romajiTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const isMatch =
      normTitle.includes(normGuess) ||
      normGuess.includes(normTitle) ||
      (normEnglish && (normEnglish.includes(normGuess) || normGuess.includes(normEnglish))) ||
      (normRomaji && (normRomaji.includes(normGuess) || normGuess.includes(normRomaji)));

    if (isMatch) {
      return res.status(200).json({
        success: true,
        correct: true,
        answerSummary
      });
    }

    return res.status(200).json({
      success: true,
      correct: false,
      message: `"${guess}" is not correct. Try revealing the next clue!`
    });
  }

  return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
}
