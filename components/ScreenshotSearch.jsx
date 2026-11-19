// components/ScreenshotSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  AlertCircle,
  Shield,
  CheckCircle2,
  ArrowRight,
  X,
  Clipboard,
  RefreshCw,
  Film,
  Clock
} from 'lucide-react';

export default function ScreenshotSearch({ onSelectAnime }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Clipboard Paste Support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith('image/')) {
          const file = clipboardItems[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file) => {
    setErrorMsg('');
    setResult(null);

    // Validate size (max 3.0MB to stay safely under Vercel serverless request body limits)
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 3.0) {
      setErrorMsg(`File size is ${sizeInMB.toFixed(2)} MB, which exceeds the 3.0 MB limit. Please compress or crop the screenshot before uploading.`);
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndSearch = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
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

  const formatSeconds = (sec) => {
    if (!sec && sec !== 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fade-in" style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <ImageIcon size={22} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Anime Screenshot Search & Frame Identification
          </h2>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Upload a scene screenshot or press <strong>Ctrl+V</strong> to paste from your clipboard. The system matches exact video frames across broadcast anime archives via the Trace.moe API.
        </p>

        {/* Privacy Notice Banner */}
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Shield size={18} color="var(--success-text)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Zero Storage Privacy Architecture:</strong> Images uploaded or pasted are processed in ephemeral server memory buffers solely for perceptual hash extraction. Your image is never written to disk or stored remotely.
          </span>
        </div>

        {/* Drag and Drop Upload Zone */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-input)',
              transition: 'all 0.2s ease',
              marginBottom: '1.25rem'
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Click or drag and drop an anime screenshot to upload"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.85rem',
                color: 'var(--accent-cyan)'
              }}
            >
              <Upload size={24} />
            </div>

            <p style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Drag and drop an anime screenshot here, or click to browse
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Supports JPG, PNG, WebP (Max 5 MB) &bull; You can also press <kbd style={{ background: 'var(--bg-elevated)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>Ctrl+V</kbd> to paste
            </p>
          </div>
        ) : (
          /* Image Preview & Controls */
          <div style={{ marginBottom: '1.25rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Selected Image: {selectedFile?.name || 'Pasted from clipboard'} ({((selectedFile?.size || 0) / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="btn-ghost"
                style={{ fontSize: '0.76rem', color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <X size={14} />
                Remove / Replace
              </button>
            </div>

            <div style={{ position: 'relative', maxHeight: '340px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', textAlign: 'center', background: '#000' }}>
              <img
                src={previewUrl}
                alt="Selected screenshot preview"
                style={{ maxWidth: '100%', maxHeight: '340px', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleUploadAndSearch}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ padding: '0.55rem 1.25rem' }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RefreshCw size={14} className="spin" />
                    Matching Frame against Anime Catalog...
                  </span>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Search Video Frames</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div
            className="fade-in"
            style={{
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div
            className="panel fade-in"
            style={{
              background: 'linear-gradient(145deg, #131B2E, #0F172A)',
              border: '1px solid var(--accent-cyan)',
              marginTop: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Frame Match Found: {result.title}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'flex-start' }}>
              {/* Match Video Preview */}
              {result.videoUrl ? (
                <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
                  <video
                    src={result.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: '100%', display: 'block' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.3rem 0.5rem', textAlign: 'center' }}>
                    Exact matched video segment
                  </div>
                </div>
              ) : result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt="Matched frame"
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                />
              ) : null}

              {/* Exact Episode & Timestamp breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.78rem' }}>
                  {result.similarity && (
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-text)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                      Similarity: {(result.similarity * 100).toFixed(1)}%
                    </span>
                  )}
                  {result.episode && (
                    <span style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Film size={12} />
                      Episode {result.episode}
                    </span>
                  )}
                  {result.from !== undefined && (
                    <span style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} />
                      Timestamp: {formatSeconds(result.from)} - {formatSeconds(result.to)}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {result.synopsis || `Matched against broadcast footage via Trace.moe.`}
                </p>

                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => onSelectAnime(result.title)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.84rem', padding: '0.45rem 0.95rem' }}
                  >
                    <span>Recall Full Anime Clues & Details</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
