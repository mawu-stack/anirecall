// components/VisualExamples.jsx
import React, { useState } from 'react';
import { Sparkles, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export const VISUAL_EXAMPLES = [
  {
    id: 'odd-taxi-memory',
    teaser: "Walrus Taxi Driver & The Missing Girl",
    category: "Mystery • Suspense",
    image: "https://cdn.myanimelist.net/images/anime/1160/115509.jpg",
    accent: "#F59E0B",
    text: "A walrus taxi driver gets caught up in a missing girl mystery in a city populated by animals.",
    clueHighlights: ["Walrus taxi driver", "City populated by animals", "Missing girl mystery", "Suspense"]
  },
  {
    id: 'steins-gate-memory',
    teaser: "The Microwave That Sends Text Messages to the Past",
    category: "Sci-Fi • Time Leap",
    image: "https://cdn.myanimelist.net/images/anime/1935/127974.jpg",
    accent: "#06B6D4",
    text: "An eccentric researcher in Akihabara in a white lab coat hooks a phone to a microwave, accidentally discovering text messages sent into the past.",
    clueHighlights: ["Mad scientist", "Lab coat", "Phone microwave", "Gel bananas", "D-mails to past"]
  },
  {
    id: 'death-note-memory',
    teaser: "Eating Potato Chips Under Surveillance",
    category: "Psychological • Suspense",
    image: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    accent: "#8B5CF6",
    text: "A top high school student finds a supernatural notebook dropped by a death god and wages a tactical cat-and-mouse game against an eccentric detective.",
    clueHighlights: ["Death god", "Black notebook", "Eating potato chips", "Crouching detective", "Tennis match"]
  },
  {
    id: 'spirited-away-memory',
    teaser: "Food Stalls That Turn Parents into Pigs",
    category: "Supernatural • Classic Film",
    image: "https://cdn.myanimelist.net/images/anime/40/644.jpg",
    accent: "#10B981",
    text: "A young girl's parents wander into an abandoned carnival and transform, forcing her to work at a magical bathhouse for spirits.",
    clueHighlights: ["Parents turn into pigs", "Spirit bathhouse", "Abandoned carnival", "No-Face", "Dragon river spirit"]
  },
  {
    id: 'your-name-memory',
    teaser: "Body Swapping and the Splitting Comet",
    category: "Romance • Celestial Mystery",
    image: "https://cdn.myanimelist.net/images/anime/1915/129707.jpg",
    accent: "#38BDF8",
    text: "Two teenagers separated by distance begin waking up in each other's bodies, leaving clues on their hands and phones before a comet approaches.",
    clueHighlights: ["Body swap", "Tokyo boy", "Shrine maiden", "Writing on palm", "Splitting comet"]
  },
  {
    id: 'bunny-girl-memory',
    teaser: "Bunny Girl Wandering a Public Library",
    category: "Psychological • Supernatural",
    image: "https://cdn.myanimelist.net/images/anime/1301/93586.jpg",
    accent: "#A78BFA",
    text: "A high school student encounters a famous teenage actress walking around a quiet library unnoticed in a bunny girl suit.",
    clueHighlights: ["Bunny suit", "Quiet library", "Invisible celebrity", "Puberty syndrome", "Adolescence"]
  },
  {
    id: 'madoka-memory',
    teaser: "A Darker Take on Magical Girl Contracts",
    category: "Dark Fantasy • Mystery",
    image: "https://cdn.myanimelist.net/images/anime/11/55225.jpg",
    accent: "#F43F5E",
    text: "A magical girl series where a contract with a small cat-like creature leads to unexpected psychological drama and surreal witch labyrinths.",
    clueHighlights: ["Magical girl", "Blonde mentor", "Flintlock muskets", "Witch labyrinth", "Soul gem"]
  }
];

export default function VisualExamples({ onSelectExample }) {
  const [expanded, setExpanded] = useState(false);
  const displayedExamples = expanded ? VISUAL_EXAMPLES : VISUAL_EXAMPLES.slice(0, 3);

  return (
    <section style={{ marginBottom: '1.75rem' }} aria-label="Visual Memory Search Examples">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Try an Image-Backed Memory
          </h2>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Click any scene to populate and recall
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '0.9rem'
        }}
      >
        {displayedExamples.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => onSelectExample(ex.text)}
            className="panel card-interactive"
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              overflow: 'hidden',
              textAlign: 'left',
              cursor: 'pointer',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            aria-label={`Select example: ${ex.teaser}`}
          >
            {/* Visual Header with Real Artwork */}
            <div style={{ position: 'relative', height: '110px', width: '100%', overflow: 'hidden' }}>
              <img
                src={ex.image}
                alt={ex.teaser}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 20%',
                  filter: 'brightness(0.75)'
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/260x110?text=Anime+Scene';
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, var(--bg-card) 0%, rgba(19, 27, 46, 0.4) 60%, transparent 100%)'
                }}
              />
              {/* Category Pill */}
              <span
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  left: '0.5rem',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: 'rgba(11, 15, 25, 0.75)',
                  backdropFilter: 'blur(6px)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${ex.accent}`
                }}
              >
                {ex.category}
              </span>
            </div>

            {/* Content body */}
            <div style={{ padding: '0.75rem 0.85rem 0.85rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.45rem',
                  lineHeight: 1.3
                }}
              >
                {ex.teaser}
              </h3>

              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  marginBottom: '0.65rem',
                  flex: 1
                }}
              >
                {ex.text}
              </p>

              {/* Clue Highlights preview */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto' }}>
                {ex.clueHighlights.slice(0, 3).map((clue, ci) => (
                  <span
                    key={ci}
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '0.12rem 0.4rem',
                      borderRadius: '4px'
                    }}
                  >
                    #{clue}
                  </span>
                ))}
              </div>

              {/* Action indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.3rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  marginTop: '0.65rem',
                  paddingTop: '0.45rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <span>Test Memory</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Expand / Collapse Control */}
      <div style={{ textAlign: 'center', marginTop: '0.85rem' }}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="btn btn-secondary"
          style={{ fontSize: '0.82rem', padding: '0.35rem 0.95rem' }}
        >
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Show fewer examples
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Show more memory examples ({VISUAL_EXAMPLES.length - 3} more)
            </>
          )}
        </button>
      </div>
    </section>
  );
}
