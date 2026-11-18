// components/SavedHistory.jsx
import React from 'react';
import { BookmarkCheck, Trash2, RotateCcw, ExternalLink, ShieldCheck } from 'lucide-react';

export default function SavedHistory({
  historyItems,
  onReopenSearch,
  onDeleteItem,
  onClearAll
}) {
  return (
    <div className="fade-in" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookmarkCheck size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Found It! Collection & History ({historyItems.length})
            </h2>
          </div>

          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="btn btn-danger"
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
            >
              <Trash2 size={13} />
              Clear All Saved
            </button>
          )}
        </div>

        {/* Local Storage Privacy Notice */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.95rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <ShieldCheck size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Local Storage Guarantee:</strong> Your confirmed discoveries and memory prompts are stored privately in your browser's LocalStorage. No account is required, and no search histories are tracked on remote servers.
          </span>
        </div>

        {/* Empty State */}
        {historyItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Your collection is empty
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Whenever you identify an anime and click "Found it!", it will be saved here along with the memory clues you used to find it.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="panel fade-in"
                style={{
                  background: 'var(--bg-input)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}
              >
                <img
                  src={item.anime.posterUrl}
                  alt={item.anime.title}
                  style={{
                    width: '75px',
                    height: '105px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)'
                  }}
                />

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {item.anime.title}
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Confirmed on {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="btn-ghost"
                      style={{ color: 'var(--text-muted)', padding: '0.2rem' }}
                      title="Remove from saved collection"
                      aria-label="Remove item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Original user query */}
                  <div style={{ background: 'var(--bg-card)', padding: '0.45rem 0.65rem', borderRadius: '4px', marginTop: '0.5rem', marginBottom: '0.65rem' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      What you remembered:
                    </p>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{item.originalQuery || 'Manual clue search'}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onReopenSearch(item)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                    >
                      <RotateCcw size={13} />
                      Reopen Search Clues
                    </button>

                    {item.anime.sourceUrl && (
                      <a
                        href={item.anime.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                      >
                        <ExternalLink size={13} />
                        View Catalog
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
