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
  candidates = [],
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

  const getUid = (c) => c?.uid || `${c?.source || 'anilist'}:${c?.id}`;

  const toggleSpoiler = (uid) => {
    setRevealedSpoilers(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const handleSelectCompare = (cand) => {
    const candUid = getUid(cand);
    if (selectedForCompare.some(c => getUid(c) === candUid)) {
      setSelectedForCompare(selectedForCompare.filter(c => getUid(c) !== candUid));
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
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
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
            <div key={k} className="panel skeleton-card" style={{ height: '220px' }} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && candidates.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Possible Matches ({candidates.length})
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Ranked by memory evidence
            </span>
          </div>

          {candidates.map((cand, index) => {
            const candUid = getUid(cand);
            const isComparing = selectedForCompare.some(c => getUid(c) === candUid);
            const isSpoilerShown = revealedSpoilers[candUid];

            return (
              <article
                key={candUid || index}
                className="panel card-interactive fade-in"
                style={{
                  display: 'flex',
                  gap: '1.25rem',
                  position: 'relative',
                  outline: isComparing ? '2px solid var(--accent-violet)' : 'none',
                  flexWrap: 'wrap',
                  padding: '1.2rem'
                }}
              >
                {/* Large Poster Artwork (155px x 220px) with interactive drawer click */}
                <div
                  style={{
                    flexShrink: 0,
                    width: '155px',
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
                    title="Click to view full anime details and characters"
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
                      alt={`Poster artwork for ${cand.title}`}
                      style={{
                        width: '100%',
                        height: '220px',
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
                        fontSize: '0.74rem',
                        fontWeight: 600
                      }}
                      className="poster-hover-overlay"
                    >
                      <Maximize2 size={18} />
                      <span>View Details</span>
                    </div>
                  </div>

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
                      marginBottom: '0.35rem'
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: '1.25rem',
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
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
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

                  {/* Concise Metadata Chips (Year, Format, Episodes, Genres) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.65rem'
                    }}
                  >
                    {cand.year && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>{cand.year}</span>}
                    {cand.format && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{cand.format}</span>}
                    {cand.episodes && <span style={{ background: 'var(--bg-main)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{cand.episodes} eps</span>}
                    {cand.genres && cand.genres.slice(0, 3).map((g, gi) => (
                      <span key={gi} style={{ background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>{g}</span>
                    ))}
                  </div>

                  {/* Featured "Why it fits" Section: 2-3 grounded evidence points */}
                  {cand.matchingClues && cand.matchingClues.length > 0 && (
                    <div
                      style={{
                        margin: '0.35rem 0 0.65rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.75rem'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--success-text)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Sparkles size={13} />
                        Why it fits:
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '1.15rem',
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem'
                        }}
                      >
                        {cand.matchingClues.slice(0, 3).map((match, mi) => (
                          <li key={mi}>{match}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Discrepancies if any */}
                  {cand.conflictingClues && cand.conflictingClues.length > 0 && (
                    <div
                      style={{
                        marginBottom: '0.65rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.45rem 0.75rem'
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--danger-text)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                        Potential Discrepancies:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.8rem', color: 'var(--danger-text)' }}>
                        {cand.conflictingClues.slice(0, 2).map((conf, ci) => (
                          <li key={ci}>{conf}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Concise synopsis teaser with Drawer link */}
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      marginBottom: '0.75rem'
                    }}
                  >
                    {cand.synopsis && cand.synopsis.length > 160 ? cand.synopsis.slice(0, 160) + '...' : cand.synopsis}
                    <button
                      type="button"
                      onClick={() => setActiveDrawerAnime(cand)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        paddingLeft: '0.35rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Full Details & Cast →
                    </button>
                  </p>

                  {/* Spoiler Shielding Control */}
                  {cand.spoilerExplanation && (
                    <div
                      style={{
                        marginBottom: '0.85rem',
                        background: 'var(--bg-input)',
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--warning-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <AlertTriangle size={13} />
                          Spoiler Protection
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSpoiler(candUid)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-cyan)',
                            fontSize: '0.74rem',
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
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
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
                      Not this one
                    </button>

                    <button
                      type="button"
                      onClick={() => onRefineCandidate(cand)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}
                      title="Specify what's close and add corrections"
                    >
                      Refine
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
          isComparing={selectedForCompare.some(c => getUid(c) === getUid(activeDrawerAnime))}
        />
      )}
    </div>
  );
}
