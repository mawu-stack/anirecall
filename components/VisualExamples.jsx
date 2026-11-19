// components/VisualExamples.jsx
import React from 'react';
import { Sparkles, ArrowRight, PlayCircle, Eye } from 'lucide-react';

export const VISUAL_EXAMPLES = [
  {
    id: 'steins-gate-memory',
    teaser: "The Microwave That Sends Text Messages to the Past",
    category: "Sci-Fi • Time Leap",
    image: "https://cdn.myanimelist.net/images/anime/1935/127974.jpg",
    accent: "#06B6D4",
    text: "A self-proclaimed mad scientist in Akihabara in a white lab coat hooks a cell phone to a microwave to turn green bananas into gel, accidentally discovering time travel.",
    clueHighlights: ["Mad scientist", "Lab coat", "Phone microwave", "Gel bananas", "D-mails to past"]
  },
  {
    id: 'death-note-memory',
    teaser: "Eating Potato Chips Under Surveillance",
    category: "Psychological • Suspense",
    image: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    accent: "#8B5CF6",
    text: "A top high school student finds a notebook dropped by a death god, writing criminals' names while eating potato chips with a mini TV hidden inside to evade a crouching detective.",
    clueHighlights: ["Death god", "Black notebook", "Eating potato chips", "Crouching detective", "Tennis match"]
  },
  {
    id: 'madoka-memory',
    teaser: "Muskets and the Episode 3 Candy Witch",
    category: "Dark Fantasy • Deconstruction",
    image: "https://cdn.myanimelist.net/images/anime/11/55225.jpg",
    accent: "#F43F5E",
    text: "A dark magical girl story where a veteran blonde mentor who summons flintlock muskets suffers a shocking decapitation by a dessert clown witch in episode 3.",
    clueHighlights: ["Magical girl", "Blonde mentor", "Flintlock muskets", "Dessert clown witch", "Soul gem"]
  },
  {
    id: 'spirited-away-memory',
    teaser: "Food Stalls That Turn Parents into Pigs",
    category: "Supernatural • Classic Film",
    image: "https://cdn.myanimelist.net/images/anime/40/644.jpg",
    accent: "#10B981",
    text: "A young girl's parents greedily gorge at unattended food stalls in an abandoned carnival, turning into giant pigs, forcing her to work at a bathhouse for Japanese spirits.",
    clueHighlights: ["Parents turn into pigs", "Spirit bathhouse", "Abandoned carnival", "No-Face", "Dragon river spirit"]
  },
  {
    id: 'tokyo-ghoul-memory',
    teaser: "Counting Down from 1000 by 7",
    category: "Dark Supernatural • Action",
    image: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
    accent: "#EC4899",
    text: "A college boy receives ghoul organ transplants, wears a one-eyed leather mask, and his hair turns snow-white while counting backwards from 1000 by 7 during intense torture.",
    clueHighlights: ["Eyepatch mask", "Hair turns white", "1000 minus 7", "Centipede torture", "Ghoul organs"]
  },
  {
    id: 'your-name-memory',
    teaser: "Body Swapping and the Splitting Comet",
    category: "Romance • Celestial Mystery",
    image: "https://cdn.myanimelist.net/images/anime/1915/129707.jpg",
    accent: "#38BDF8",
    text: "A high school boy in Tokyo and a rural shrine maiden mysteriously swap bodies, writing notes on their faces and palms before discovering a split comet threatens her mountain hometown.",
    clueHighlights: ["Body swap", "Tokyo boy", "Shrine maiden", "Writing on palm", "Splitting comet"]
  },
  {
    id: 'bunny-girl-memory',
    teaser: "Playboy Bunny Wandering a Public Library",
    category: "Psychological Mystery • Supernatural",
    image: "https://cdn.myanimelist.net/images/anime/1301/93586.jpg",
    accent: "#A78BFA",
    text: "A high school boy sees a famous teenage actress walking around a quiet public library wearing a bunny girl suit, but nobody else can see or remember her existence.",
    clueHighlights: ["Bunny suit", "Quiet library", "Invisible celebrity", "Puberty syndrome", "Adolescence"]
  }
];

export default function VisualExamples({ onSelectExample }) {
  return (
    <section style={{ marginBottom: '1.75rem' }} aria-label="Visual Memory Search Examples">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
        {VISUAL_EXAMPLES.map((ex) => (
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
                dangerouslySetInnerHTML={{ __html: ex.category }}
              />
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
    </section>
  );
}
