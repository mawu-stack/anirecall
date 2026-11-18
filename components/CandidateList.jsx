// components/CandidateList.jsx
import React, { useState } from 'react';
import { Check, X, Sparkles, ExternalLink, Columns, Eye, EyeOff, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function CandidateList({
  candidates,
  onConfirmCandidate,
  onExcludeCandidate,
  onRefineCandidate,
  onCompareCandidates,
  reasoningSummary,
  isLoading
}) {
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  const toggleSpoiler = (id) => {
    setRevealedSpoilers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectCompare = (cand) => {
    if (selectedForCompare.some(c => c.id === cand.id)) {
      setSelectedForCompare(selectedForCompare.filter(c => c.id !== cand.id));
    } else {
      if (selectedForCompare.length < 2) {
        const next = [...selectedForCompare, cand];
        setSelectedForCompare(next);
        if (next.length === 2) {
          onCompareCandidates(next[0], next[1]);
          setSelectedForCompare([]);
        }
      }
    }
  };

  return (
    <div>
      {/* Reasoning and summary banner */}
      {reasoningSummary && (
        <div
          className="panel"
          style={{
            marginBottom: '1.25rem',
            padding: '0.9rem 1.1rem',
            background: 'rgba(30, 41, 59, 0.6)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} color="var(--accent-violet-light)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-violet-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Grounding & Retrieval Summary
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {reasoningSummary}
          </p>
        </div>
      )}

      {/* Compare selection indicator */}
      {selectedForCompare.length === 1 && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid var(--accent-violet)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem'
        }}>
          <span>Selected <strong>{selectedForCompare[0].title}</strong>. Click "Compare" on a second anime to see side-by-side differences.</span>
          <button
            type="button"
            onClick={() => setSelectedForCompare([])}
            className="btn btn-ghost"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Empty State */}
      {candidates.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No verified matches for current criteria
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
            Try describing a memorable moment, specific weapon or outfit, or loosen strict year/format filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {candidates.map((cand, index) => {
            const isComparing = selectedForCompare.some(c => c.id === cand.id);
            const isSpoilerShown = revealedSpoilers[cand.id];

            return (
              <article
                key={cand.id || index}
                className="panel fade-in"
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  position: 'relative',
                  outline: isComparing ? '2px solid var(--accent-violet)' : 'none',
                  transition: 'border-color 0.2s ease',
                  flexWrap: 'wrap'
                }}
              >
                {/* Poster Artwork with fallback */}
                <div style={{ flexShrink: 0, width: '135px', position: 'relative' }}>
                  <img
                    src={cand.posterUrl || 'https://via.placeholder.com/225x320?text=No+Poster'}
                    alt={`Official poster for ${cand.title}`}
                    style={{
                      width: '100%',
                      height: '190px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-main)'
                    }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/225x320?text=Poster';
                    }}
                  />
                  {/* Verified source link */}
                  {cand.sourceUrl && (
                    <a
                      href={cand.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        marginTop: '0.45rem',
                        fontSize: '0.74rem',
                        color: 'var(--accent-cyan)',
                        textDecoration: 'none'
                      }}
                      title="View catalog record on MyAnimeList / AniList"
                    >
                      <ExternalLink size={11} />
                      Catalog Record
                    </a>
                  )}
                </div>

                {/* Candidate Content Body */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  {/* Header & Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {cand.title}
                      </h2>
                      {cand.englishTitle && cand.englishTitle !== cand.title && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {cand.englishTitle}
                        </p>
                      )}
                    </div>

                    {/* Match Tier Badge */}
                    <span
                      className={`badge ${
                        cand.matchTier === 'Strong match'
                          ? 'badge-strong'
                          : cand.matchTier === 'Possible match'
                          ? 'badge-possible'
                          : 'badge-needs-more'
                      }`}
                    >
                      {cand.matchTier || 'Possible match'}
                    </span>
                  </div>

                  {/* Metadata Chips: Catalog ID, Year, Format, Studio, Episodes, Genres */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    <span style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                      ID: #{cand.malId || cand.id}
                    </span>
                    {cand.year && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{cand.year}</span>}
                    {cand.format && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{cand.format}</span>}
                    {cand.episodes && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{cand.episodes} eps</span>}
                    {cand.studio && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Studio: {cand.studio}</span>}
                    {cand.genres && cand.genres.slice(0, 3).map((g, gi) => (
                      <span key={gi} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{g}</span>
                    ))}
                  </div>

                  {/* Grounded Synopsis */}
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
                    {cand.synopsis}
                  </p>

                  {/* Clue Breakdown: Matching, Conflicting, Unverified */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.9rem', fontSize: '0.8rem' }}>
                    {cand.matchingClues && cand.matchingClues.length > 0 && (
                      <div style={{ color: 'var(--success-text)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>✓ Matches:</span>
                        <span>{cand.matchingClues.join('; ')}</span>
                      </div>
                    )}

                    {cand.conflictingClues && cand.conflictingClues.length > 0 && (
                      <div style={{ color: 'var(--danger-text)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, flexShrink: 0 }}>✕ Conflicting:</span>
                        <span>{cand.conflictingClues.join('; ')}</span>
                      </div>
                    )}

                    {cand.unverifiedClues && cand.unverifiedClues.length > 0 && (
                      <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600, flexShrink: 0 }}>? Unverified:</span>
                        <span>{cand.unverifiedClues.join('; ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Spoiler Shielding Control */}
                  {cand.spoilerExplanation && (
                    <div style={{ marginBottom: '1rem', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--warning-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={13} />
                          Spoiler Protection
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(cand.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600
                          }}
                        >
                          {isSpoilerShown ? <EyeOff size={13} /> : <Eye size={13} />}
                          {isSpoilerShown ? 'Hide Key Plot Twist' : 'Reveal Key Plot Twist'}
                        </button>
                      </div>

                      {isSpoilerShown && (
                        <p style={{ marginTop: '0.45rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem', lineHeight: 1.4 }}>
                          {cand.spoilerExplanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Result Feedback Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => onConfirmCandidate(cand)}
                      className="btn btn-success"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
                      title="Confirm that this is the anime you were looking for"
                    >
                      <Check size={14} />
                      Found it!
                    </button>

                    <button
                      type="button"
                      onClick={() => onExcludeCandidate(cand)}
                      className="btn btn-danger"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                      title="Exclude this candidate from the current search"
                    >
                      <X size={14} />
                      That's not it
                    </button>

                    <button
                      type="button"
                      onClick={() => onRefineCandidate(cand)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                      title="Specify what's close and add corrections"
                    >
                      Close, but...
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectCompare(cand)}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.82rem',
                        padding: '0.35rem 0.75rem',
                        background: isComparing ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                        color: isComparing ? '#FFFFFF' : 'var(--text-primary)'
                      }}
                      title="Compare side by side with another candidate"
                    >
                      <Columns size={13} />
                      {isComparing ? 'Selected' : 'Compare'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
