// components/CompareModal.jsx
import React from 'react';
import { X, HelpCircle, Check, AlertCircle } from 'lucide-react';

export default function CompareModal({ comparisonData, onClose }) {
  if (!comparisonData) return null;

  const { anime1, anime2, clueBreakdown, distinguishingQuestion } = comparisonData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Side-by-Side Comparison
          </h2>
          <button type="button" onClick={onClose} className="btn-ghost" style={{ padding: '0.35rem' }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Distinguishing Question Banner */}
        {distinguishingQuestion && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid var(--accent-cyan)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem'
          }}>
            <HelpCircle size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Key Distinguishing Question:
              </p>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
                {distinguishingQuestion}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Comparison Card Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Anime 1 */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <img
                src={anime1.posterUrl}
                alt={anime1.title}
                style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>{anime1.title}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{anime1.year} • {anime1.format}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Studio: {anime1.studio}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '90px', overflowY: 'auto' }}>
              {anime1.synopsis}
            </p>
          </div>

          {/* Anime 2 */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <img
                src={anime2.posterUrl}
                alt={anime2.title}
                style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>{anime2.title}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{anime2.year} • {anime2.format}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Studio: {anime2.studio}</p>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxHeight: '90px', overflowY: 'auto' }}>
              {anime2.synopsis}
            </p>
          </div>
        </div>

        {/* Clue Breakdown Comparison Table */}
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
          Memory Clues Verification Matrix:
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>Your Clue</th>
                <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>{anime1.title}</th>
                <th style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>{anime2.title}</th>
              </tr>
            </thead>
            <tbody>
              {clueBreakdown && clueBreakdown.length > 0 ? (
                clueBreakdown.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'block' }}>
                        {row.category}
                      </span>
                      {row.clueText}
                    </td>
                    <td style={{
                      padding: '0.5rem 0.75rem',
                      color: row.statusAnime1 === 'Matches' ? 'var(--success-text)' : 'var(--text-muted)'
                    }}>
                      {row.statusAnime1}
                    </td>
                    <td style={{
                      padding: '0.5rem 0.75rem',
                      color: row.statusAnime2 === 'Matches' ? 'var(--success-text)' : 'var(--text-muted)'
                    }}>
                      {row.statusAnime2}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No specific clues extracted yet to cross-reference.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
