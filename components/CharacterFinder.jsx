// components/CharacterFinder.jsx
import React, { useState } from 'react';
import { User, Search, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';

const EXAMPLE_CHARACTER_QUERIES = [
  "Mad scientist in lab coat talking on cellphone",
  "Boy with eyepatch and white hair",
  "Girl in bunny suit in library",
  "Short blonde boy with metal automail arm",
  "Blindfolded white hair teacher with six eyes",
  "Vampire in red trench coat and fedora",
  "Elf with white twin pigtails mimic chest",
  "Short tsundere girl called Palmtop Tiger with wooden sword"
];

export default function CharacterFinder({ onSelectAnimeFromCharacter }) {
  const [query, setQuery] = useState('');
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (overrideQuery) => {
    const q = (overrideQuery || query).trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(true);

    try {
      const res = await fetch('/api/agent/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      const json = await res.json();
      if (json.success) {
        setCharacters(json.data.characters || []);
      } else {
        setErrorMessage(json.error || 'Failed to search characters.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Network error searching characters.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <User size={20} color="var(--accent-violet)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Character Appearance & Trait Finder
          </h2>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.45 }}>
          Search by distinctive hair color, clothing, eye patches, weapons, signature phrases, quirks, or supernatural abilities to locate verified characters and their series.
        </p>

        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="e.g. Eyepatch white hair torture, blonde drills musket, chainsaw on head..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.65rem 0.95rem',
              color: 'var(--text-primary)',
              fontSize: '0.92rem'
            }}
          />

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="btn btn-primary"
            style={{ padding: '0.65rem 1.25rem' }}
          >
            {isLoading ? 'Searching...' : (
              <>
                <Search size={15} />
                Find Character
              </>
            )}
          </button>
        </form>

        {/* Example prompts */}
        <div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginRight: '0.5rem' }}>
            Try trait:
          </span>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.35rem' }}>
            {EXAMPLE_CHARACTER_QUERIES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  handleSearch(ex);
                }}
                className="btn-ghost"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.2rem 0.6rem',
                  fontSize: '0.76rem'
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div style={{ color: 'var(--danger-text)', padding: '0.75rem', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}

      {/* Results */}
      {hasSearched && characters.length === 0 && !isLoading && (
        <div className="panel" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No verified characters match that specific description
          </p>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Try broadening your search terms or describing their weapon, hair color, or outfit.
          </p>
        </div>
      )}

      {characters.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {characters.map((char, idx) => (
            <div key={idx} className="panel fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <img
                    src={char.posterUrl || char.image || 'https://via.placeholder.com/100x140?text=Character'}
                    alt={char.name}
                    style={{
                      width: '65px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-main)'
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {char.name}
                    </h3>
                    {char.alias && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--accent-violet-light)' }}>
                        aka {char.alias}
                      </p>
                    )}
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Role: {char.role || 'Main'}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Linked Anime:
                  </p>
                  <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {char.animeTitle}
                  </p>
                </div>

                {char.traits && char.traits.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                    {char.traits.map((t, ti) => (
                      <span key={ti} style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.74rem', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => onSelectAnimeFromCharacter(char.animeTitle)}
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                >
                  Recall This Anime
                  <ArrowRight size={13} />
                </button>

                {char.sourceUrl && (
                  <a
                    href={char.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                    title="View catalog record"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
