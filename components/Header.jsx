// components/Header.jsx
import React, { useState } from 'react';
import { Search, User, HelpCircle, Image as ImageIcon, BookmarkCheck, Sparkles, Cpu, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function Header({
  currentMode,
  onSelectMode,
  isDemoMode,
  providerStatus = 'missing_credentials',
  geminiDiagnostics = null
}) {
  const [showDiagModal, setShowDiagModal] = useState(false);

  const renderStatusBadge = () => {
    if (providerStatus === 'ai_success') {
      const activeModel = geminiDiagnostics?.activeModel || 'gemini-2.5-flash';
      return (
        <button
          type="button"
          onClick={() => setShowDiagModal(!showDiagModal)}
          className="badge badge-strong"
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          title="Click to view Gemini agent diagnostic details"
        >
          <Cpu size={12} />
          Live AI Agent Active ({activeModel})
          {showDiagModal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      );
    }
    if (providerStatus === 'exact_title_lookup') {
      return (
        <span className="badge badge-demo" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)' }} title="Direct title match against catalog without LLM invocation">
          Exact Title Search (Direct Catalog Lookup)
        </span>
      );
    }
    if (providerStatus === 'refinement_curated') {
      return (
        <span className="badge badge-demo" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-violet)', border: '1px solid var(--accent-violet)' }} title="Refined using active curated memory clues and catalog filters">
          Curated Clue Refinement (Active Clue Filter)
        </span>
      );
    }
    if (providerStatus === 'extraction_failed') {
      return (
        <button
          type="button"
          onClick={() => setShowDiagModal(!showDiagModal)}
          className="badge badge-warning"
          style={{ cursor: 'pointer', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          title="Click to view diagnostic details"
        >
          <AlertCircle size={12} />
          AI Extraction Fallback (Deterministic Catalog Mode)
        </button>
      );
    }
    if (providerStatus === 'rate_limited') {
      return (
        <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' }} title="API Rate Limit reached. Running via local verified fixtures.">
          Provider Rate Limited (Curated Catalog Fallback Mode)
        </span>
      );
    }
    if (providerStatus === 'fallback_fixture') {
      return (
        <button
          type="button"
          onClick={() => setShowDiagModal(!showDiagModal)}
          className="badge badge-demo"
          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          title="Click to view system status"
        >
          <Cpu size={12} />
          Curated Ground-Truth Catalog Mode (Deterministic NLP Grounding)
        </button>
      );
    }
    return (
      <span className="badge badge-demo" title="Add GEMINI_API_KEY to server environment for open-ended LLM inference">
        Curated Ground-Truth Catalog Mode (Verified MAL/AniList Grounding)
      </span>
    );
  };

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        {renderStatusBadge()}

        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          Catalog Artwork & Records via AniList & MyAnimeList
        </span>
      </div>

      {/* Expandable Diagnostic Pill / Banner */}
      {showDiagModal && (
        <div
          className="fade-in"
          style={{
            maxWidth: '480px',
            margin: '0 auto 1.25rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            textAlign: 'left',
            fontSize: '0.8rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Cpu size={14} color="var(--accent-cyan)" />
              Agent Diagnostic Status
            </span>
            <button
              type="button"
              onClick={() => setShowDiagModal(false)}
              className="btn btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem' }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '0.25rem 0.5rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Provider Key:</span>
            <span style={{ color: geminiDiagnostics?.hasKey ? 'var(--success-text)' : 'var(--warning-text)', fontWeight: 600 }}>
              {geminiDiagnostics?.hasKey ? 'Configured (Server-Side)' : 'Not configured'}
            </span>

            <span style={{ color: 'var(--text-muted)' }}>Active Model:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              {geminiDiagnostics?.activeModel || 'gemini-2.5-flash'}
            </span>

            {geminiDiagnostics?.configuredModel && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>Configured Model:</span>
                <span>{geminiDiagnostics.configuredModel}</span>
              </>
            )}

            <span style={{ color: 'var(--text-muted)' }}>Diagnostic Code:</span>
            <span>{geminiDiagnostics?.errorCode || 'NONE'}</span>

            <span style={{ color: 'var(--text-muted)' }}>Provider Status:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}>{providerStatus}</span>
          </div>
        </div>
      )}

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
          aria-label="Mystery Mode"
        >
          <HelpCircle size={15} />
          Mystery Mode
        </button>

        <button
          className={`nav-tab ${currentMode === 'history' ? 'active' : ''}`}
          onClick={() => onSelectMode('history')}
          aria-label="Saved Discoveries"
        >
          <BookmarkCheck size={15} />
          Saved Discoveries
        </button>
      </nav>
    </header>
  );
}
