// pages/api/agent/screenshot.js
// Anime screenshot identification via Trace.moe API.
// Validates file size (max 3.0MB to respect Vercel 4.5MB serverless limit), retrieves exact AniList record by numeric ID,
// and honestly discloses 3rd-party Trace.moe API transmission.

import { getAnimeDetails } from '../../../lib/anime-catalog.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 field is required.' });
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({
        error: `Unsupported image type '${mimeType}'. Supported types are JPEG, PNG, and WebP.`
      });
    }

    // Validate size (max 3.0MB to stay well within Vercel's 4.5MB request limit after base64 decoding)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const sizeInMB = buffer.length / (1024 * 1024);

    if (sizeInMB > 3.0) {
      return res.status(400).json({
        error: `Image size (${sizeInMB.toFixed(2)} MB) exceeds the 3.0 MB limit. Please compress or crop the screenshot before uploading.`
      });
    }

    // Query trace.moe API
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let traceResponse = null;
    let traceData = null;

    try {
      traceResponse = await fetch('https://api.trace.moe/search?cutBorders=true', {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
        },
        body: buffer,
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (traceResponse.ok) {
        traceData = await traceResponse.json();
      }
    } catch (e) {
      // Trace.moe might be rate limited or offline
    }

    // If Trace.moe returned results
    if (traceData && traceData.result && traceData.result.length > 0) {
      const topMatch = traceData.result[0];
      const similarity = topMatch.similarity || 0;

      // Trace.moe provides numeric AniList ID; query getAnimeDetails by ID directly
      let matchedAnime = null;
      if (topMatch.anilist) {
        matchedAnime = await getAnimeDetails(`anilist:${topMatch.anilist}`);
        if (!matchedAnime) {
          matchedAnime = await getAnimeDetails(topMatch.anilist);
        }
      }

      const isHighConfidence = similarity >= 0.85;

      return res.status(200).json({
        success: true,
        data: {
          matchType: 'Exact-Frame Match (Trace.moe Database)',
          similarity: Math.round(similarity * 100),
          isHighConfidence,
          episode: topMatch.episode,
          timestampSeconds: Math.round(topMatch.from),
          previewVideo: topMatch.video,
          previewImage: topMatch.image,
          matchedAnime,
          limitationsNote: 'Trace.moe indexes exact TV and movie video frames. It cannot recognize fan art, manga panels, or heavily cropped/filtered scenes.',
          privacyStatement: 'Images are processed in memory and transmitted securely to Trace.moe (an external 3rd-party indexing service) for visual frame matching. AniRecall stores zero images persistently.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        matchType: 'No Exact Frame Match Found',
        similarity: 0,
        isHighConfidence: false,
        matchedAnime: null,
        limitationsNote: 'No exact video frame matched in the Trace.moe database. The scene may be from manga, fan art, unindexed OVA, or heavily modified.',
        privacyStatement: 'Images are processed in memory and transmitted securely to Trace.moe for visual frame matching. AniRecall stores zero images persistently.'
      }
    });
  } catch (err) {
    console.error('Screenshot search error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to process screenshot.'
    });
  }
}
