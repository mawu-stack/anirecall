// components/SimilarVibes.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, ExternalLink, Compass } from 'lucide-react';

export default function SimilarVibes({
  confirmedAnime,
  onClose,
  onSelectRecommended
}) {
  const [selectedVibe, setSelectedVibe] = useState('tone');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchVibes = async (vibe) => {
    if (!confirmedAnime) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent/vibes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeId: confirmedAnime.id,
          selectedVibe: vibe
        })
      });

      const json = await res.json();
      if (json.success) {
        setRecommendations(json.data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch similar vibes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVibes('tone');
  }, [confirmedAnime]);

  const handleVibeChange = (vibe) => {
    setSelectedVibe(vibe);
    fetchVibes(vibe);
  };

  if (!confirmedAnime) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vibes-modal-title"
    >
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '860px', width: '95%' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={22} color="var(--accent-cyan)" />
            <div>
              <h2 id="vibes-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Similar Vibes to {confirmedAnime.title}
              </h2>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Curated recommendations grounded in shared narrative DNA
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.35rem' }}
            aria-label="Close similar vibes modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vibe Category Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pivot discovery by what you loved most:
          </p>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            {[
              { id: 'tone', label: '1. Emotional Tone & Atmosphere' },
              { id: 'setting', label: '2. Worldbuilding & Setting' },
              { id: 'themes', label: '3. Core Themes & Conflicts' },
              { id: 'character', label: '4. Protagonist & Dynamics' }
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVibeChange(v.id)}
                style={{
                  background: selectedVibe === v.id ? 'var(--accent-violet)' : 'var(--bg-input)',
                  color: selectedVibe === v.id ? '#FFFFFF' : 'var(--text-secondary)',
                  border: `1px solid ${selectedVibe === v.id ? 'var(--accent-violet)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-full)',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations list */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem 0' }}>
            {[1, 2].map((k) => (
              <div key={k} className="panel skeleton-card" style={{ height: '110px' }} />
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            No specific companion titles found for this vibe criteria.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {recommendations.map((rec, idx) => (
              <div
                key={rec.id || idx}
                className="panel card-interactive fade-in"
                style={{
                  padding: '0.85rem',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.65rem' }}>
                  <img
                    src={rec.posterUrl || 'https://via.placeholder.com/150x215?text=No+Poster'}
                    alt={rec.title}
                    style={{
                      width: '70px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      flexShrink: 0
                    }}
                    loading="lazy"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {rec.title}
                    </h3>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {rec.year} &bull; {rec.format} {rec.studio ? `&bull; ${rec.studio}` : ''}
                    </p>
                    {rec.genres && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                        {rec.genres.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connection Explanation */}
                <div
                  style={{
                    background: 'var(--bg-input)',
                    padding: '0.55rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    marginBottom: '0.75rem',
                    flex: 1
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--accent-violet-light)' }}>Why it connects: </span>
                  {rec.reason || `Shares similar narrative focus and pacing.`}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectRecommended(rec.title);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem', justifyContent: 'center' }}
                >
                  <span>Explore this anime</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
