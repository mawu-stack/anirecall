// components/SimilarVibes.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowRight, ExternalLink } from 'lucide-react';

export default function SimilarVibes({
  confirmedAnime,
  onClose,
  onSelectRecommended
}) {
  const [selectedVibe, setSelectedVibe] = useState('tone');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent-violet-light)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Similar Vibes to {confirmedAnime.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Vibe Category Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>
            Choose which element you loved most:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'tone', label: 'Dark / Emotional Tone' },
              { id: 'setting', label: 'Worldbuilding & Setting' },
              { id: 'character', label: 'Protagonist & Dynamics' }
            ].map(v => (
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
                  fontSize: '0.84rem',
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
          <p style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            Curating verified recommendations...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="panel fade-in"
                style={{
                  background: 'var(--bg-input)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}
              >
                <img
                  src={rec.posterUrl}
                  alt={rec.title}
                  style={{ width: '80px', height: '115px', objectFit: 'cover', borderRadius: '4px' }}
                />

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {rec.title}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rec.year} • {rec.format}
                    </span>
                  </div>

                  {/* Why it matches connection explanation */}
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    borderLeft: '3px solid var(--accent-violet)',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '0 4px 4px 0',
                    margin: '0.45rem 0 0.6rem',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)'
                  }}>
                    <strong>Why it matches:</strong> {rec.connectionExplanation}
                  </div>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.65rem' }}>
                    {rec.synopsis}
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecommended(rec.title);
                        onClose();
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    >
                      Explore This Anime
                      <ArrowRight size={13} />
                    </button>

                    {rec.sourceUrl && (
                      <a
                        href={rec.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                      >
                        <ExternalLink size={13} />
                        Catalog Record
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'right' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
