// components/CompareModal.jsx
import React, { useEffect } from 'react';
import { X, HelpCircle, Check, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';

export default function CompareModal({ comparisonData, onClose, onConfirmCandidate }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!comparisonData) return null;

  const { anime1, anime2, clueBreakdown, distinguishingQuestion } = comparisonData;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '920px', width: '95%' }}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h2 id="compare-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Side-by-Side Visual Comparison
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.35rem' }}
            aria-label="Close comparison modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Distinguishing Question Banner */}
        {distinguishingQuestion && (
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-md)',
              padding: '0.95rem 1.15rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}
          >
            <HelpCircle size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Key Distinguishing Question:
              </p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.2rem', lineHeight: 1.4 }}>
                {distinguishingQuestion}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Comparison Card Grid (Responsive & Stacks on Mobile) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* Candidate 1 */}
          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '0.85rem' }}>
              <img
                src={anime1.posterUrl || 'https://via.placeholder.com/150x215?text=No+Poster'}
                alt={anime1.title}
                style={{
                  width: '90px',
                  height: '130px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>Candidate A</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0' }}>
                  {anime1.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {anime1.year} &bull; {anime1.format} {anime1.studio ? `&bull; ${anime1.studio}` : ''}
                </p>
                {anime1.genres && (
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {anime1.genres.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, maxHeight: '85px', overflowY: 'auto', marginBottom: '0.85rem' }}>
              {anime1.synopsis}
            </p>

            {onConfirmCandidate && (
              <button
                type="button"
                onClick={() => {
                  onConfirmCandidate(anime1);
                  onClose();
                }}
                className="btn btn-success"
                style={{ fontSize: '0.82rem', padding: '0.4rem', justifyContent: 'center', marginTop: 'auto' }}
              >
                <Check size={14} />
                Found it! Confirm {anime1.title}
              </button>
            )}
          </div>

          {/* Candidate 2 */}
          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', gap: '0.9rem', marginBottom: '0.85rem' }}>
              <img
                src={anime2.posterUrl || 'https://via.placeholder.com/150x215?text=No+Poster'}
                alt={anime2.title}
                style={{
                  width: '90px',
                  height: '130px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-violet-light)', fontWeight: 700 }}>Candidate B</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.15rem 0' }}>
                  {anime2.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {anime2.year} &bull; {anime2.format} {anime2.studio ? `&bull; ${anime2.studio}` : ''}
                </p>
                {anime2.genres && (
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {anime2.genres.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, maxHeight: '85px', overflowY: 'auto', marginBottom: '0.85rem' }}>
              {anime2.synopsis}
            </p>

            {onConfirmCandidate && (
              <button
                type="button"
                onClick={() => {
                  onConfirmCandidate(anime2);
                  onClose();
                }}
                className="btn btn-success"
                style={{ fontSize: '0.82rem', padding: '0.4rem', justifyContent: 'center', marginTop: 'auto' }}
              >
                <Check size={14} />
                Found it! Confirm {anime2.title}
              </button>
            )}
          </div>
        </div>

        {/* Clue Breakdown Comparison Table */}
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
          Memory Clues Verification Matrix:
        </h4>
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>Your Clue</th>
                <th style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)' }}>{anime1.title}</th>
                <th style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--accent-violet-light)' }}>{anime2.title}</th>
              </tr>
            </thead>
            <tbody>
              {clueBreakdown && clueBreakdown.length > 0 ? (
                clueBreakdown.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '0.55rem 0.85rem', fontWeight: 600 }}>{row.clueText}</td>
                    <td style={{ padding: '0.55rem 0.85rem' }}>
                      <span style={{
                        color: row.anime1Status === 'Matches' ? 'var(--success-text)' : row.anime1Status === 'Conflicting' ? 'var(--danger-text)' : 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {row.anime1Status === 'Matches' ? '✓ ' : row.anime1Status === 'Conflicting' ? '✕ ' : '? '}
                        {row.anime1Status}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.85rem' }}>
                      <span style={{
                        color: row.anime2Status === 'Matches' ? 'var(--success-text)' : row.anime2Status === 'Conflicting' ? 'var(--danger-text)' : 'var(--text-muted)',
                        fontWeight: 600
                      }}>
                        {row.anime2Status === 'Matches' ? '✓ ' : row.anime2Status === 'Conflicting' ? '✕ ' : '? '}
                        {row.anime2Status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No specific clue comparisons generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
