// pages/api/agent/recall.js
// Server-side API endpoint for the AniRecall tool-using agent.
// Validates inputs, limits request size, enforces timeouts, and executes the grounded agent loop.

import { runRecallAgent } from '../../../lib/agent-core.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const {
      query = '',
      existingClues = [],
      excludedIds = [],
      followUpAnswer = null,
      mode = 'story',
      answeredCategories = [],
      previousQuestions = []
    } = req.body || {};

    // Validate input types and limits
    if (typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query format. Expected string.' });
    }

    if (query.length > 2000) {
      return res.status(400).json({ error: 'Query is too long (maximum 2,000 characters).' });
    }

    if (!Array.isArray(existingClues)) {
      return res.status(400).json({ error: 'existingClues must be an array.' });
    }

    if (!Array.isArray(excludedIds)) {
      return res.status(400).json({ error: 'excludedIds must be an array.' });
    }

    // Execute the agent pipeline
    const agentResult = await runRecallAgent({
      query: query.trim(),
      existingClues,
      excludedIds,
      followUpAnswer,
      mode,
      answeredCategories: Array.isArray(answeredCategories) ? answeredCategories : [],
      previousQuestions: Array.isArray(previousQuestions) ? previousQuestions : []
    });

    return res.status(200).json({
      success: true,
      data: agentResult
    });
  } catch (err) {
    console.error('Agent execution error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while processing memory clues.'
    });
  }
}
