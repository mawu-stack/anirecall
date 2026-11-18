// components/Header.jsx
import React from 'react';
import { Search, User, HelpCircle, Image as ImageIcon, BookmarkCheck, Sparkles } from 'lucide-react';

export default function Header({ currentMode, onSelectMode, isDemoMode }) {
  return (
    <header style={{ textAlign: 'center', paddingTop: '1rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <Sparkles size={18} />
        </div>
        <span style={{
          fontSize: '1.05rem',
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--accent-violet-light)'
        }}>
          AniRecall
        </span>
      </div>

      {/* Main Required Headline */}
      <h1 style={{
        fontSize: '2.15rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        color: 'var(--text-primary)',
        margin: '0.2rem 0 0.4rem',
        lineHeight: 1.2
      }}>
        What anime are you trying to remember?
      </h1>

      <p style={{
        fontSize: '1.05rem',
        color: 'var(--text-secondary)',
        marginBottom: '0.85rem',
        fontWeight: 400
      }}>
        “You remember the scene. We’ll find the anime.”
      </p>

      {/* Status Badges & Attribution */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {isDemoMode ? (
          <span className="badge badge-demo" title="Add GEMINI_API_KEY to .env.local for open-ended LLM inference">
            Curated Ground-Truth Catalog Mode (Verified MAL/AniList Grounding)
          </span>
        ) : (
          <span className="badge badge-strong">
            Live AI Agent Active (Google Gemini + AniList/Jikan APIs)
          </span>
        )}

        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          Catalog Artwork & Records via AniList & MyAnimeList
        </span>
      </div>

      {/* Navigation Mode Tabs */}
      <nav className="nav-tabs" aria-label="Search Modes">
        <button
          className={`nav-tab ${currentMode === 'story' ? 'active' : ''}`}
          onClick={() => onSelectMode('story')}
          aria-label="Story or Scene Search"
        >
          <Search size={15} />
          Story or Scene
        </button>

        <button
          className={`nav-tab ${currentMode === 'character' ? 'active' : ''}`}
          onClick={() => onSelectMode('character')}
          aria-label="Character Finder"
        >
          <User size={15} />
          Character
        </button>

        <button
          className={`nav-tab ${currentMode === 'screenshot' ? 'active' : ''}`}
          onClick={() => onSelectMode('screenshot')}
          aria-label="Screenshot Search"
        >
          <ImageIcon size={15} />
          Screenshot
        </button>

        <button
          className={`nav-tab ${currentMode === 'mystery' ? 'active' : ''}`}
          onClick={() => onSelectMode('mystery')}
          aria-label="Mystery Guessing Game"
        >
          <HelpCircle size={15} />
          Mystery Mode
        </button>

        <button
          className={`nav-tab ${currentMode === 'history' ? 'active' : ''}`}
          onClick={() => onSelectMode('history')}
          aria-label="Saved Confirmed Anime Collection"
        >
          <BookmarkCheck size={15} />
          Found It! Collection
        </button>
      </nav>
    </header>
  );
}
