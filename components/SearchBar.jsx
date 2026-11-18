// components/SearchBar.jsx
import React from 'react';
import { Search, Sparkles, X, ArrowRight } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  {
    label: "Microwave & gel bananas",
    text: "A mad scientist in Akihabara puts green bananas in a modified microwave and accidentally sends text messages to the past."
  },
  {
    label: "Potato chip & black notebook",
    text: "A genius high schooler finds a dropped death god notebook, eats a potato chip while watching a hidden mini TV, and fights a crouching detective."
  },
  {
    label: "Decapitation in episode 3",
    text: "A dark magical girl anime where a blonde girl with muskets gets her head bitten off by a candy clown witch in episode 3."
  },
  {
    label: "Parents turned into pigs",
    text: "A girl wanders into an abandoned amusement park and her parents turn into giant pigs after gorging at food stalls, leading to a spirit bathhouse."
  },
  {
    label: "Eyepatch & 1000 minus 7",
    text: "A college boy gets transplanted ghoul organs, wears an eyepatch, and has his hair turn white while counting backwards from 1000 by 7 during torture."
  },
  {
    label: "Comet & body swap",
    text: "A high school boy in Tokyo and a rural shrine maiden wake up in each other's bodies and write notes on their hands before a comet splits in half."
  },
  {
    label: "Bunny girl in library",
    text: "A high school boy sees a famous teenage actress walking around a quiet public library wearing a bunny girl suit, but nobody else can see her."
  }
];

export default function SearchBar({
  query,
  onChangeQuery,
  onSearch,
  isLoading,
  searchMode,
  onChangeSearchMode
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <label
            htmlFor="recall-input"
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={16} color="var(--accent-cyan)" />
            What do you remember?
          </label>

          {/* Search Mode Toggle */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-main)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => onChangeSearchMode('story')}
              style={{
                background: searchMode === 'story' ? 'var(--accent-violet)' : 'transparent',
                color: searchMode === 'story' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Story / Scene
            </button>
            <button
              type="button"
              onClick={() => onChangeSearchMode('title')}
              style={{
                background: searchMode === 'title' ? 'var(--accent-violet)' : 'transparent',
                color: searchMode === 'title' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Exact Title
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            id="recall-input"
            rows={searchMode === 'title' ? 1 : 3}
            value={query}
            onChange={(e) => onChangeQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              searchMode === 'title'
                ? "Enter anime title (e.g., Steins;Gate, Death Note)..."
                : "Describe anything: a weird scene, a character's clothes, powers, when or where you watched it, dialogue, setting, or ending twist..."
            }
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 3.5rem 0.85rem 0.95rem',
              color: 'var(--text-primary)',
              fontSize: '0.94rem',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s ease',
              minHeight: searchMode === 'title' ? '46px' : '82px'
            }}
          />

          <div style={{ position: 'absolute', right: '0.65rem', top: '0.65rem', display: 'flex', gap: '0.35rem' }}>
            {query && (
              <button
                type="button"
                onClick={() => onChangeQuery('')}
                className="btn-ghost"
                style={{ padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}
                aria-label="Clear search input"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.45rem 0.85rem',
                opacity: isLoading || !query.trim() ? 0.6 : 1
              }}
              aria-label="Recall Anime"
            >
              {isLoading ? (
                <span style={{ fontSize: '0.82rem' }}>Recalling...</span>
              ) : (
                <>
                  <Search size={15} />
                  <span style={{ fontSize: '0.85rem' }}>Recall</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Clickable Example Prompts */}
      <div style={{ marginTop: '0.85rem' }}>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Try an example memory:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChangeQuery(ex.text);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '0.28rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-violet-light)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
