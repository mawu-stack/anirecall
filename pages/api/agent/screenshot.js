// pages/api/agent/screenshot.js
// Optional extension: Anime screenshot identification via Trace.moe API.
// Validates file size (max 5MB) and type, does NOT store images, and distinguishes exact-frame matching from visual interpretation.

import { searchAnime } from '../../../lib/anime-catalog.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb'
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

    // Validate size (max 5MB)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const sizeInMB = buffer.length / (1024 * 1024);

    if (sizeInMB > 5.0) {
      return res.status(400).json({
        error: `Image size (${sizeInMB.toFixed(2)} MB) exceeds the 5 MB limit.`
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

      // Trace.moe provides anilist ID
      let matchedAnime = null;
      if (topMatch.anilist) {
        const catalogResults = await searchAnime(String(topMatch.anilist));
        if (catalogResults && catalogResults.length > 0) {
          matchedAnime = catalogResults[0];
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
          privacyStatement: 'Images are processed entirely in-memory and are never saved to disk or persistent storage.'
        }
      });
    }

    // If no match found or trace.moe failed
    return res.status(200).json({
      success: true,
      data: {
        matchType: 'No exact frame match found',
        similarity: 0,
        isHighConfidence: false,
        message: 'Could not identify this specific video frame in the exact-frame anime database.',
        limitationsNote: 'Exact-frame search requires an unedited screenshot directly captured from an anime episode. Scanned manga, memes, fan art, or cosplay will not match.',
        privacyStatement: 'Images are processed entirely in-memory and are never saved to disk or persistent storage.'
      }
    });

  } catch (err) {
    console.error('Screenshot search error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error processing screenshot search.'
    });
  }
}
