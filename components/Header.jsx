// components/Header.jsx
import React from 'react';
import { Search, User, HelpCircle, Image as ImageIcon, BookmarkCheck, Sparkles } from 'lucide-react';

export default function Header({ currentMode, onSelectMode, isDemoMode }) {
  return (
    <header style={{ textAlign: 'center', paddingTop: '1rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <Sparkles size={20} />
        </div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, #F8FAFC 60%, #A78BFA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          AniRecall
        </h1>
      </div>

      <p style={{
        fontSize: '1.05rem',
        color: 'var(--text-secondary)',
        marginBottom: '0.75rem',
        fontWeight: 400
      }}>
        “You remember the scene. We’ll find the anime.”
      </p>

      {/* Mode status badge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
        {isDemoMode ? (
          <span className="badge badge-demo" title="Add GEMINI_API_KEY to .env.local for open-ended LLM inference">
            Curated Ground-Truth Catalog Mode (Verified MAL/AniList Grounding)
          </span>
        ) : (
          <span className="badge badge-strong">
            Live AI Agent Active (Google Gemini + AniList/Jikan APIs)
          </span>
        )}
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
          Character Finder
        </button>

        <button
          className={`nav-tab ${currentMode === 'screenshot' ? 'active' : ''}`}
          onClick={() => onSelectMode('screenshot')}
          aria-label="Screenshot Search"
        >
          <ImageIcon size={15} />
          Screenshot Match
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
