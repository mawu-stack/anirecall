// components/Footer.jsx
import React from 'react';
import { Sparkles, Shield, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: '4rem',
        paddingTop: '2rem',
        paddingBottom: '2.5rem',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }}
      aria-label="Application Credits and Footer"
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        {/* Brand identity pill */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span>AniRecall &mdash; Anime Memory Identification Agent</span>
        </div>

        {/* Required Developer Credits */}
        <p
          style={{
            fontSize: '0.96rem',
            fontWeight: 600,
            color: 'var(--accent-violet-light)',
            letterSpacing: '0.01em',
            margin: '0.25rem 0'
          }}
        >
          Developed by Mawutorwu Klu and Skythen Therlonge.
        </p>

        {/* Attribution and architecture disclosures */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '640px', lineHeight: 1.5 }}>
          Built with Next.js 14, React 18, and grounded catalog verification via AniList GraphQL, MyAnimeList (Jikan v4), and Trace.moe. 
          Anime artwork and catalog records remain the intellectual property of their respective creators and production committees.
        </p>

        {/* Repository link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.35rem', fontSize: '0.82rem' }}>
          <a
            href="https://github.com/mawu-stack/anirecall"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontWeight: 500
            }}
          >
            <Github size={14} />
            GitHub Repository
          </a>
          <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
            <Shield size={13} color="var(--success-text)" />
            Zero Tracking &bull; Local Storage Only
          </span>
        </div>
      </div>
    </footer>
  );
}
