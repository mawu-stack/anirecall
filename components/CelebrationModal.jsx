// components/CelebrationModal.jsx
import React, { useEffect } from 'react';
import { Sparkles, CheckCircle2, BookmarkCheck, Compass, X } from 'lucide-react';

export default function CelebrationModal({ anime, onClose, onOpenSimilarVibes }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!anime) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(6px)',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease forwards'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(145deg, #131B2E, #0F172A)',
          border: '1px solid var(--accent-violet)',
          boxShadow: '0 12px 40px rgba(139, 92, 246, 0.25)',
          padding: '1.75rem',
          textAlign: 'center',
          position: 'relative',
          animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost"
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', color: 'var(--text-muted)' }}
          aria-label="Close celebration message"
        >
          <X size={18} />
        </button>

        {/* Animated Celebration Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10B981, #06B6D4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
          }}
        >
          <CheckCircle2 size={36} color="#FFFFFF" />
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--success-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}
        >
          Memory Solved!
        </span>

        <h2
          id="celebration-title"
          style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: '0.35rem 0 0.25rem',
            lineHeight: 1.25
          }}
        >
          {anime.title}
        </h2>

        {anime.year && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {anime.year} &bull; {anime.format || 'TV'} {anime.studio ? `&bull; ${anime.studio}` : ''}
          </p>
        )}

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem',
            lineHeight: 1.45
          }}
        >
          <BookmarkCheck size={16} color="var(--accent-cyan)" style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
          Saved to your browser's <strong>Found It!</strong> collection. You can revisit your original memory description and clues anytime without losing this record.
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSimilarVibes();
            }}
            className="btn btn-primary"
            style={{ fontSize: '0.86rem', padding: '0.55rem 1rem' }}
          >
            <Compass size={16} />
            Explore Similar Vibes
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.86rem', padding: '0.55rem 1rem' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
