// components/CandidateList.jsx
import React, { useState } from 'react';
import {
  Check,
  X,
  Sparkles,
  ExternalLink,
  Columns,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  Maximize2,
  Info
} from 'lucide-react';
import DetailDrawer from './DetailDrawer';

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
  const [activeDrawerAnime, setActiveDrawerAnime] = useState(null);

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
      if (selectedForCompare.length === 0) {
        setSelectedForCompare([cand]);
      } else if (selectedForCompare.length === 1) {
        const next = [selectedForCompare[0], cand];
        setSelectedForCompare(next);
        onCompareCandidates(next[0], next[1]);
      } else {
        const next = [selectedForCompare[0], cand];
        setSelectedForCompare(next);
        onCompareCandidates(next[0], next[1]);
      }
    }
  };

  return (
    <div>
      {/* Reasoning and summary banner */}
      {reasoningSummary && (
        <div
          className="panel fade-in"
          style={{
            marginBottom: '1.25rem',
            padding: '0.9rem 1.15rem',
            background: 'rgba(30, 41, 59, 0.6)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <ShieldCheck size={16} color="var(--accent-violet-light)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-violet-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Grounding & Retrieval Verification
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {reasoningSummary}
          </p>
        </div>
      )}

      {/* Compare selection indicator bar */}
      {selectedForCompare.length > 0 && (
        <div
          className="fade-in"
          style={{
            position: 'sticky',
            top: '0.75rem',
            zIndex: 30,
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-violet)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Columns size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Comparison Queue:
            </span>
            <span style={{ background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.82rem', border: '1px solid var(--border-subtle)', color: 'var(--accent-violet-light)' }}>
              1. {selectedForCompare[0].title}
            </span>
            {selectedForCompare.length === 2 ? (
              <span style={{ background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.82rem', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)' }}>
                2. {selectedForCompare[1].title}
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                (Click "Compare" on a second anime to see side-by-side differences)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            {selectedForCompare.length === 2 && (
              <button
                type="button"
                onClick={() => onCompareCandidates(selectedForCompare[0], selectedForCompare[1])}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
              >
                Compare Side-by-Side
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedForCompare([])}
              className="btn btn-ghost"
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[1, 2].map((k) => (
            <div key={k} className="panel skeleton-card" style={{ height: '210px' }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && candidates.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--text-muted)'
            }}
          >
            <Sparkles size={22} />
          </div>
          <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No verified matches for current criteria
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
            Try describing a memorable moment, specific weapon or outfit, or loosen strict year/format filters in the Clue Manager.
          </p>
        </div>
      ) : null}

      {/* Candidate List Cards */}
      {!isLoading && candidates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {candidates.map((cand, index) => {
            const isComparing = selectedForCompare.some(c => c.id === cand.id);
            const isSpoilerShown = revealedSpoilers[cand.id];

            return (
              <article
                key={cand.id || index}
                className="panel card-interactive fade-in"
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  position: 'relative',
                  outline: isComparing ? '2px solid var(--accent-violet)' : 'none',
                  flexWrap: 'wrap',
                  padding: '1.15rem'
                }}
              >
                {/* Poster Artwork with interactive drawer click & fallback */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '135px',
                    position: 'relative'
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setActiveDrawerAnime(cand)}
                    title="Click to open rich details, characters, and scenes drawer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveDrawerAnime(cand);
                      }
                    }}
                    aria-label={`View full details for ${cand.title}`}
                  >
                    <img
                      src={cand.posterUrl || 'https://via.placeholder.com/225x320?text=No+Poster'}
                      alt={`Official poster for ${cand.title}`}
                      style={{
                        width: '100%',
                        height: '190px',
                        objectFit: 'cover',
                        display: 'block',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-main)',
                        transition: 'transform 0.25s ease'
                      }}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/225x320?text=Poster';
                      }}
                    />
                    {/* Hover Overlay Hint */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(11, 15, 25, 0.65)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.25rem',
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 600
                      }}
                      className="poster-hover-overlay"
                    >
                      <Maximize2 size={16} />
                      <span>View Details</span>
                    </div>
                  </div>

                  {/* Verified source link outside the button */}
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
                      title="View verified record on MyAnimeList / AniList"
                    >
                      <ExternalLink size={11} />
                      Catalog Record
                    </a>
                  )}
                </div>

                {/* Candidate Content Body */}
                <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column' }}>
                  {/* Header & Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.4rem'
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          margin: 0,
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveDrawerAnime(cand)}
                      >
                        {cand.title}
                      </h3>
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
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <span style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
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
                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '0.85rem'
                    }}
                  >
                    {cand.synopsis}
                  </p>

                  {/* Clue Breakdown: Matching, Conflicting, Unverified */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      marginBottom: '0.9rem',
                      fontSize: '0.8rem',
                      background: 'rgba(0, 0, 0, 0.15)',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
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
                    <div
                      style={{
                        marginBottom: '1rem',
                        background: 'var(--bg-input)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
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
                        <p
                          style={{
                            marginTop: '0.45rem',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '0.45rem',
                            lineHeight: 1.45
                          }}
                        >
                          {cand.spoilerExplanation}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Result Actions Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.45rem',
                      alignItems: 'center',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.75rem',
                      marginTop: 'auto'
                    }}
                  >
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

                    <button
                      type="button"
                      onClick={() => setActiveDrawerAnime(cand)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem', marginLeft: 'auto' }}
                      title="Open full anime details and characters"
                    >
                      <Info size={13} />
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Rich Detail Drawer */}
      {activeDrawerAnime && (
        <DetailDrawer
          anime={activeDrawerAnime}
          onClose={() => setActiveDrawerAnime(null)}
          onConfirm={(cand) => {
            onConfirmCandidate(cand);
            setActiveDrawerAnime(null);
          }}
          onExclude={(cand) => {
            onExcludeCandidate(cand);
            setActiveDrawerAnime(null);
          }}
          onRefine={(cand) => onRefineCandidate(cand)}
          onCompare={(cand) => handleSelectCompare(cand)}
          isComparing={selectedForCompare.some(c => c.id === activeDrawerAnime.id)}
        />
      )}
    </div>
  );
}
