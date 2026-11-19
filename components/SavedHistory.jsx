// components/SavedHistory.jsx
import React, { useState } from 'react';
import {
  BookmarkCheck,
  Trash2,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  List,
  Sparkles,
  Info
} from 'lucide-react';
import DetailDrawer from './DetailDrawer';

export default function SavedHistory({
  historyItems,
  onReopenSearch,
  onDeleteItem,
  onClearAll
}) {
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'list'
  const [activeDrawerAnime, setActiveDrawerAnime] = useState(null);

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        {/* Title Bar & View Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookmarkCheck size={22} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Found It! Gallery & Collection ({historyItems.length})
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* View Mode Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                style={{
                  background: viewMode === 'gallery' ? 'var(--accent-violet)' : 'transparent',
                  color: viewMode === 'gallery' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                aria-label="Poster Gallery View"
              >
                <LayoutGrid size={13} />
                Gallery
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--accent-violet)' : 'transparent',
                  color: viewMode === 'list' ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                aria-label="List Details View"
              >
                <List size={13} />
                List
              </button>
            </div>

            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <Trash2 size={13} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Local Storage Privacy Notice */}
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}
        >
          <ShieldCheck size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Private Local Collection:</strong> Your confirmed discoveries and memory prompts are held privately in your browser's LocalStorage. No account is required, and zero search histories are sent to remote tracking servers.
          </span>
        </div>

        {/* Empty State */}
        {historyItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--accent-cyan)'
              }}
            >
              <BookmarkCheck size={28} />
            </div>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.45rem' }}>
              Your collection is empty
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
              Whenever you identify an anime and click <strong>"Found it!"</strong>, it will appear here as a personal memory gallery with your original clues.
            </p>
          </div>
        ) : (
          <>
            {/* Gallery View */}
            {viewMode === 'gallery' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                  gap: '1.15rem'
                }}
              >
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="panel card-interactive"
                    style={{
                      padding: 0,
                      overflow: 'hidden',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Poster with click to open drawer */}
                    <div
                      style={{ position: 'relative', height: '260px', cursor: 'pointer', overflow: 'hidden' }}
                      onClick={() => setActiveDrawerAnime(item.anime)}
                      title={`Click to view details for ${item.anime.title}`}
                    >
                      <img
                        src={item.anime.posterUrl || 'https://via.placeholder.com/225x320?text=No+Poster'}
                        alt={item.anime.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, var(--bg-card) 0%, rgba(19, 27, 46, 0.2) 60%, transparent 100%)'
                        }}
                      />
                      {item.anime.year && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'rgba(11, 15, 25, 0.75)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            color: 'var(--accent-cyan)',
                            fontWeight: 700
                          }}
                        >
                          {item.anime.year}
                        </span>
                      )}
                    </div>

                    {/* Metadata & Controls */}
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: '0.35rem',
                          lineHeight: 1.3,
                          cursor: 'pointer'
                        }}
                        onClick={() => setActiveDrawerAnime(item.anime)}
                      >
                        {item.anime.title}
                      </h3>

                      <p
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.35,
                          marginBottom: '0.75rem',
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        Memory: "{item.originalQuery}"
                      </p>

                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => onReopenSearch(item)}
                          className="btn btn-secondary"
                          style={{ flex: 1, fontSize: '0.72rem', padding: '0.25rem 0.4rem', justifyContent: 'center' }}
                          title="Re-run this search with saved clues"
                        >
                          <RotateCcw size={12} />
                          Reopen
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="btn-ghost"
                          style={{ padding: '0.25rem 0.45rem', color: 'var(--danger-text)' }}
                          title="Remove from saved collection"
                          aria-label="Remove from saved collection"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
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
                      src={item.anime.posterUrl || 'https://via.placeholder.com/150x215?text=No+Poster'}
                      alt={item.anime.title}
                      style={{
                        width: '75px',
                        height: '105px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setActiveDrawerAnime(item.anime)}
                    />

                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3
                            style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, cursor: 'pointer' }}
                            onClick={() => setActiveDrawerAnime(item.anime)}
                          >
                            {item.anime.title}
                          </h3>
                          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            Confirmed on {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="btn-ghost"
                          style={{ color: 'var(--danger-text)', padding: '0.3rem' }}
                          title="Remove from history"
                          aria-label="Remove from saved collection"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {/* Original Memory Description */}
                      <div
                        style={{
                          marginTop: '0.65rem',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Your Memory Description: </span>
                        "{item.originalQuery}"
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          type="button"
                          onClick={() => onReopenSearch(item)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem' }}
                        >
                          <RotateCcw size={13} />
                          Reopen Search
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveDrawerAnime(item.anime)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem' }}
                        >
                          <Info size={13} />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Drawer Integration */}
      {activeDrawerAnime && (
        <DetailDrawer
          anime={activeDrawerAnime}
          onClose={() => setActiveDrawerAnime(null)}
          onConfirm={() => {}}
          onExclude={() => {}}
          onRefine={() => {}}
          onCompare={() => {}}
          isComparing={false}
        />
      )}
    </div>
  );
}
