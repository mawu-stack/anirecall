// components/ScreenshotSearch.jsx
import React, { useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ScreenshotSearch({ onSelectAnime }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setResult(null);

    // Validate size (max 5MB)
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 5.0) {
      setErrorMsg(`File size is ${sizeInMB.toFixed(2)} MB, which exceeds the 5 MB limit.`);
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg(`Unsupported file type (${file.type}). Please select a JPG, PNG, or WebP image.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadAndSearch = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;

        const res = await fetch('/api/agent/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: selectedFile.type
          })
        });

        const json = await res.json();
        if (json.success) {
          setResult(json.data);
        } else {
          setErrorMsg(json.error || 'Failed to analyze screenshot.');
        }
        setIsLoading(false);
      };

      reader.onerror = () => {
        setErrorMsg('Failed to read image file.');
        setIsLoading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setErrorMsg(err.message || 'Error uploading screenshot.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <ImageIcon size={20} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Anime Screenshot Search (Trace.moe Integration)
          </h2>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Upload a raw scene screenshot to query exact anime video frames.
        </p>

        {/* Privacy Notice Banner */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.95rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <Shield size={16} color="var(--success-text)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Privacy Guarantee:</strong> Uploaded images are processed strictly in-memory for visual matching and are <strong>never stored</strong> or persisted to disk or cloud storage.
          </span>
        </div>

        {/* File Drop / Select Area */}
        <div style={{
          border: '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          background: 'var(--bg-input)',
          cursor: 'pointer',
          marginBottom: '1rem',
          transition: 'all 0.2s ease'
        }}>
          <input
            type="file"
            id="screenshot-input"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="screenshot-input" style={{ cursor: 'pointer', display: 'block' }}>
            <Upload size={32} color="var(--accent-cyan)" style={{ margin: '0 auto 0.65rem' }} />
            <p style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Click or drag a screenshot here
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Supports PNG, JPG, WebP up to 5 MB
            </p>
          </label>
        </div>

        {/* Selected file preview */}
        {previewUrl && (
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
            <img
              src={previewUrl}
              alt="Uploaded screenshot preview"
              style={{ width: '100px', height: '65px', objectFit: 'cover', borderRadius: '4px' }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedFile?.name}
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {(selectedFile?.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile?.type}
              </p>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleUploadAndSearch}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem' }}
            >
              {isLoading ? 'Matching Frames...' : 'Identify Anime'}
            </button>
          </div>
        )}

        {errorMsg && (
          <div style={{ color: 'var(--danger-text)', padding: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.84rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <AlertCircle size={15} />
            {errorMsg}
          </div>
        )}

        {/* Limitations Clarification Box */}
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.45
        }}>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Frame Matching vs. Visual Interpretation:
          </p>
          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
            <li><strong>Exact Frame Matching:</strong> Matches unedited broadcast anime frames down to the specific episode and second timestamp.</li>
            <li><strong>Current Limitations:</strong> Heavily cropped images, subtitles covering the scene, flipped clips, fan art, and manga scans are not present in official frame archives.</li>
          </ul>
        </div>
      </div>

      {/* Match Result Card */}
      {result && (
        <div className="panel fade-in" style={{ borderLeft: `4px solid ${result.isHighConfidence ? 'var(--success-border)' : 'var(--warning-border)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: result.isHighConfidence ? 'var(--success-text)' : 'var(--warning-text)', textTransform: 'uppercase' }}>
              {result.matchType} ({result.similarity}% Similarity)
            </span>
            {result.isHighConfidence && (
              <span className="badge badge-strong">
                <CheckCircle2 size={12} />
                High Confidence Match
              </span>
            )}
          </div>

          {result.matchedAnime ? (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <img
                src={result.matchedAnime.posterUrl}
                alt={result.matchedAnime.title}
                style={{ width: '90px', height: '130px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {result.matchedAnime.title}
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                  Episode: {result.episode || 'N/A'} • Timestamp: {Math.floor(result.timestampSeconds / 60)}m {result.timestampSeconds % 60}s
                </p>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  {result.matchedAnime.synopsis}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectAnime(result.matchedAnime.title)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
                >
                  Recall Clues for This Anime
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {result.message}
            </p>
          )}

          {result.previewImage && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Matched Master Video Frame:
              </p>
              <img
                src={result.previewImage}
                alt="Matched anime frame"
                style={{ maxHeight: '180px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
