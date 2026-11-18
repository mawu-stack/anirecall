// components/DetailDrawer.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Columns,
  Play,
  Film,
  Tv,
  Calendar,
  Users,
  Sparkles,
  Info
} from 'lucide-react';

export default function DetailDrawer({
  anime,
  onClose,
  onConfirm,
  onExclude,
  onRefine,
  onCompare,
  isComparing
}) {
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const drawerRef = useRef(null);

  // Close on Escape key press & prevent body scrolling when open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus close button inside drawer for accessibility
    if (drawerRef.current) {
      drawerRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!anime) return null;

  // Extract trailer YouTube ID if present
  let youtubeVideoId = null;
  if (anime.trailerUrl) {
    const match = anime.trailerUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) youtubeVideoId = match[1];
  } else if (anime.trailer && typeof anime.trailer === 'string') {
    const match = anime.trailer.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) youtubeVideoId = match[1];
  }

  // Fallback banner generator from poster
  const bannerBg = anime.bannerUrl || anime.posterUrl;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(5px)',
        animation: 'fadeIn 0.2s ease forwards'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          height: '100vh',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
          overflowY: 'auto',
          position: 'relative',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Hero Header with Banner Artwork */}
        <div style={{ position: 'relative', minHeight: '190px', width: '100%', overflow: 'hidden' }}>
          {bannerBg && (
            <img
              src={bannerBg}
              alt=""
              style={{
                width: '100%',
                height: '190px',
                objectFit: 'cover',
                filter: 'brightness(0.4) blur(1px)'
              }}
            />
          )}

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, var(--bg-card) 5%, rgba(19, 27, 46, 0.6) 60%, transparent 100%)'
            }}
          />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(11, 15, 25, 0.7)',
              borderRadius: 'var(--radius-full)',
              padding: '0.4rem',
              color: 'var(--text-primary)',
              zIndex: 10
            }}
            aria-label="Close anime details drawer"
          >
            <X size={18} />
          </button>

          {/* Header Overlay Info */}
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1.25rem',
              right: '1.25rem',
              display: 'flex',
              gap: '1rem',
              alignItems: 'flex-end'
            }}
          >
            <img
              src={anime.posterUrl || 'https://via.placeholder.com/150x215?text=No+Poster'}
              alt={anime.title}
              style={{
                width: '95px',
                height: '135px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-subtle)',
                flexShrink: 0
              }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                className={`badge ${
                  anime.matchTier === 'Strong match'
                    ? 'badge-strong'
                    : anime.matchTier === 'Possible match'
                    ? 'badge-possible'
                    : 'badge-needs-more'
                }`}
                style={{ marginBottom: '0.35rem', display: 'inline-block' }}
              >
                {anime.matchTier || 'Possible match'}
              </span>

              <h2
                id="drawer-title"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  margin: '0.2rem 0'
                }}
              >
                {anime.title}
              </h2>

              {anime.englishTitle && anime.englishTitle !== anime.title && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {anime.englishTitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Metadata Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', fontSize: '0.78rem' }}>
            <span style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700 }}>
              MAL ID: #{anime.malId || anime.id}
            </span>
            {anime.year && (
              <span style={{ background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                Released: {anime.year} {anime.season ? `(${anime.season})` : ''}
              </span>
            )}
            {anime.format && (
              <span style={{ background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                {anime.format} {anime.episodes ? `&bull; ${anime.episodes} episodes` : ''}
              </span>
            )}
            {anime.studio && (
              <span style={{ background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                Studio: {anime.studio}
              </span>
            )}
          </div>

          {/* Genres Chips */}
          {anime.genres && anime.genres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {anime.genres.map((g, gi) => (
                <span
                  key={gi}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => {
                onConfirm(anime);
                onClose();
              }}
              className="btn btn-success"
              style={{ flex: 1, minWidth: '140px', justifyContent: 'center' }}
            >
              <Check size={16} />
              Found it! (Confirm)
            </button>

            <button
              type="button"
              onClick={() => {
                onExclude(anime);
                onClose();
              }}
              className="btn btn-danger"
              style={{ flex: 1, minWidth: '130px', justifyContent: 'center' }}
            >
              <X size={16} />
              That's not it
            </button>

            <button
              type="button"
              onClick={() => onRefine(anime)}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              Close, but...
            </button>

            <button
              type="button"
              onClick={() => onCompare(anime)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '0.4rem 0.75rem',
                background: isComparing ? 'var(--accent-violet)' : 'var(--bg-elevated)',
                color: isComparing ? '#FFFFFF' : 'var(--text-primary)'
              }}
            >
              <Columns size={14} />
              {isComparing ? 'Selected' : 'Compare'}
            </button>
          </div>

          {/* Grounded Synopsis */}
          <section>
            <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
              Verified Synopsis
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {anime.synopsis}
            </p>
          </section>

          {/* Clue Alignment Matrix */}
          <section style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={15} color="var(--accent-violet-light)" />
              Clue Alignment & Grounding Analysis
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
              {anime.matchingClues && anime.matchingClues.length > 0 ? (
                <div style={{ color: 'var(--success-text)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, flexShrink: 0 }}>✓ Matches:</span>
                  <span>{anime.matchingClues.join('; ')}</span>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No direct token overlaps with current search text.</div>
              )}

              {anime.conflictingClues && anime.conflictingClues.length > 0 && (
                <div style={{ color: 'var(--danger-text)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, flexShrink: 0 }}>✕ Conflicting:</span>
                  <span>{anime.conflictingClues.join('; ')}</span>
                </div>
              )}

              {anime.unverifiedClues && anime.unverifiedClues.length > 0 && (
                <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>? Unverified:</span>
                  <span>{anime.unverifiedClues.join('; ')}</span>
                </div>
              )}
            </div>
          </section>

          {/* Characters Section (when available) */}
          {anime.characters && anime.characters.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={14} />
                Key Characters & Traits
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.55rem' }}>
                {anime.characters.map((char, ci) => (
                  <div
                    key={ci}
                    style={{
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {char.name} {char.alias ? <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({char.alias})</span> : ''}
                    </div>
                    {char.role && <div style={{ color: 'var(--accent-cyan)', fontSize: '0.72rem' }}>{char.role}</div>}
                    {char.traits && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', marginTop: '0.2rem' }}>
                        Traits: {Array.isArray(char.traits) ? char.traits.join(', ') : char.traits}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Memorable Scenes List (when available) */}
          {anime.scenes && anime.scenes.length > 0 && (
            <section>
              <h3 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Film size={14} />
                Memorable Grounded Scenes
              </h3>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {anime.scenes.map((sc, sci) => (
                  <li key={sci} style={{ marginBottom: '0.25rem' }}>
                    {sc}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Optional Verified Trailer Interaction */}
          {youtubeVideoId && (
            <section style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Play size={15} color="var(--accent-cyan)" />
                  Official Anime Trailer
                </span>
                <button
                  type="button"
                  onClick={() => setShowTrailer(!showTrailer)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem' }}
                >
                  {showTrailer ? 'Close Trailer' : 'Watch Trailer'}
                </button>
              </div>

              {showTrailer && (
                <div style={{ marginTop: '0.75rem', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1`}
                    title={`Official trailer for ${anime.title}`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </section>
          )}

          {/* Official Viewing Links & Regional Disclosure */}
          <section style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Official Viewing & Catalog Links
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.55rem' }}>
              {anime.sourceUrl && (
                <a
                  href={anime.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem', color: 'var(--accent-cyan)' }}
                >
                  <ExternalLink size={12} />
                  MyAnimeList Record
                </a>
              )}
              {anime.siteUrl && (
                <a
                  href={anime.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem', color: 'var(--accent-violet-light)' }}
                >
                  <ExternalLink size={12} />
                  AniList Record
                </a>
              )}
            </div>

            {anime.platforms && anime.platforms.length > 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <strong>Documented streaming licenses:</strong> {anime.platforms.join(', ')}
              </div>
            ) : null}

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              <Info size={11} style={{ display: 'inline', marginRight: '3px' }} />
              Streaming rights vary by country and region (e.g., North America vs Europe or Japan). Check availability in your country directly on official service portals.
            </p>
          </section>

          {/* Spoiler Shielding Control */}
          {anime.spoilerExplanation && (
            <section style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--warning-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AlertTriangle size={15} />
                  Spoiler Protection (Key Plot Twist)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSpoiler(!showSpoiler)}
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
                  {showSpoiler ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showSpoiler ? 'Hide Twist' : 'Reveal Twist'}
                </button>
              </div>

              {showSpoiler && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', lineHeight: 1.45 }}>
                  {anime.spoilerExplanation}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
