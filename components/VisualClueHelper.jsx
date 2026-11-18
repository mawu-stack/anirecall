// components/VisualClueHelper.jsx
import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Rocket,
  Landmark,
  Building2,
  Skull,
  HelpCircle,
  Eye,
  FlaskConical,
  Crosshair,
  Wand2,
  Tv,
  Film,
  Video,
  Clock,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const SETTING_OPTIONS = [
  { label: 'School / Academy', category: 'setting', value: 'High school or academy setting', icon: GraduationCap },
  { label: 'Fantasy / Isekai', category: 'setting', value: 'Fantasy world or parallel realm', icon: Sparkles },
  { label: 'Space / Sci-Fi', category: 'setting', value: 'Space, futuristic sci-fi or mecha', icon: Rocket },
  { label: 'Historical / Feudal', category: 'setting', value: 'Historical or feudal era Japan', icon: Landmark },
  { label: 'City / Modern Urban', category: 'setting', value: 'Modern city or Tokyo metropolis', icon: Building2 },
  { label: 'Dystopian / Post-Apocalyptic', category: 'setting', value: 'Dystopian or post-apocalyptic ruin', icon: Skull },
  { label: 'Unsure of Setting', category: 'setting', value: 'Uncertain setting', icon: HelpCircle }
];

const TRAIT_OPTIONS = [
  { label: 'Eyepatch / Mask', category: 'character', value: 'Character with eyepatch or mask', icon: Eye },
  { label: 'Lab Coat / Scientist', category: 'character', value: 'Scientist in white lab coat', icon: FlaskConical },
  { label: 'White / Silver Hair', category: 'character', value: 'Protagonist with white or silver hair', icon: Sparkles },
  { label: 'Weapon / Sword', category: 'character', value: 'Uses distinctive sword or firearm', icon: Crosshair },
  { label: 'Supernatural Powers', category: 'character', value: 'Supernatural or magical abilities', icon: Wand2 }
];

const FORMAT_OPTIONS = [
  { label: 'TV Series', category: 'format', value: 'TV episodic series', icon: Tv },
  { label: 'Movie / Film', category: 'format', value: 'Feature animated film / movie', icon: Film },
  { label: 'OVA / Special', category: 'format', value: 'OVA or short special', icon: Video }
];

const RELEASE_ERA_OPTIONS = [
  { label: '1980s / 1990s Classic', category: 'approx_year', value: 'Released in 1980s or 1990s', icon: Clock },
  { label: '2000s Era', category: 'approx_year', value: 'Released in 2000s', icon: Calendar },
  { label: '2010s Era', category: 'approx_year', value: 'Released in 2010s', icon: Calendar },
  { label: '2020s Recent', category: 'approx_year', value: 'Released in 2020s', icon: Calendar }
];

const WATCHED_ERA_OPTIONS = [
  { label: 'Watched Recently (2023-2026)', category: 'watched_year', value: 'Watched around 2024 (recent)', icon: Clock },
  { label: 'Watched in 2020-2022', category: 'watched_year', value: 'Watched around 2021', icon: Clock },
  { label: 'Watched in the 2010s', category: 'watched_year', value: 'Watched around 2015', icon: Clock },
  { label: 'Watched in Childhood (90s-00s)', category: 'watched_year', value: 'Watched in childhood (classic era)', icon: Clock }
];

export default function VisualClueHelper({ clues, onUpdateClues }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('setting'); // 'setting' | 'traits' | 'format' | 'release_era' | 'watched_era'

  // Helper to check if a specific value is already in clues
  const findMatchingClue = (value) => {
    return clues.find(c => c.text === value);
  };

  const handleToggleOption = (opt) => {
    const existing = findMatchingClue(opt.value);
    if (existing) {
      // If already present, remove it
      onUpdateClues(clues.filter(c => c.id !== existing.id));
    } else {
      // Add as new clue default to 'maybe' (soft preference)
      const newClue = {
        id: `clue-visual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        category: opt.category,
        text: opt.value,
        confidence: 'maybe'
      };
      onUpdateClues([...clues, newClue]);
    }
  };

  const handleToggleCertainty = (e, opt) => {
    e.stopPropagation();
    const existing = findMatchingClue(opt.value);
    if (existing) {
      const updated = clues.map(c => {
        if (c.id === existing.id) {
          return {
            ...c,
            confidence: c.confidence === 'sure' ? 'maybe' : 'sure'
          };
        }
        return c;
      });
      onUpdateClues(updated);
    }
  };

  const renderOptionList = (options) => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '0.65rem',
          marginTop: '0.75rem'
        }}
      >
        {options.map((opt, idx) => {
          const Icon = opt.icon;
          const matchingClue = findMatchingClue(opt.value);
          const isSelected = Boolean(matchingClue);
          const isSure = matchingClue?.confidence === 'sure';

          return (
            <div
              key={idx}
              onClick={() => handleToggleOption(opt)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: isSelected
                  ? isSure
                    ? 'rgba(16, 185, 129, 0.14)'
                    : 'rgba(139, 92, 246, 0.16)'
                  : 'var(--bg-card)',
                border: isSelected
                  ? `1px solid ${isSure ? 'var(--success-border)' : 'var(--accent-violet)'}`
                  : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              className="card-interactive"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleOption(opt);
                }
              }}
              aria-pressed={isSelected}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: isSelected ? (isSure ? 'var(--success-border)' : 'var(--accent-violet)') : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    flexShrink: 0
                  }}
                >
                  <Icon size={14} />
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {opt.label}
                </span>
              </div>

              {isSelected && (
                <button
                  type="button"
                  onClick={(e) => handleToggleCertainty(e, opt)}
                  title={`Click to switch between Sure (hard criteria) and Maybe (soft preference). Currently: ${isSure ? 'Sure' : 'Maybe'}`}
                  style={{
                    background: isSure ? 'var(--success-border)' : 'var(--accent-violet)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.12rem 0.45rem',
                    color: '#FFFFFF',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginLeft: '0.4rem',
                    flexShrink: 0
                  }}
                >
                  {isSure ? 'Sure ✓' : 'Maybe ?'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="panel"
      style={{
        marginBottom: '1.25rem',
        background: 'rgba(19, 27, 46, 0.75)',
        borderColor: 'var(--border-subtle)',
        padding: '0.85rem 1.15rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Sparkles size={16} color="var(--accent-violet-light)" />
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Help Me Remember (Visual Clue Builder)
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
            &bull; Select setting, character features, or release vs. watch era
          </span>
        </div>

        <button
          type="button"
          className="btn-ghost"
          style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
          aria-label={isExpanded ? 'Collapse clue helper' : 'Expand clue helper'}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="fade-in" style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
            {[
              { id: 'setting', label: '1. Setting' },
              { id: 'traits', label: '2. Protagonist & Traits' },
              { id: 'format', label: '3. Format' },
              { id: 'release_era', label: '4. Release Era' },
              { id: 'watched_era', label: '5. When YOU Watched It' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'var(--accent-violet)' : 'var(--bg-main)',
                  color: activeTab === tab.id ? '#FFFFFF' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'setting' && renderOptionList(SETTING_OPTIONS)}
          {activeTab === 'traits' && renderOptionList(TRAIT_OPTIONS)}
          {activeTab === 'format' && renderOptionList(FORMAT_OPTIONS)}
          {activeTab === 'release_era' && (
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Production era when the anime was animated / released in Japan:
              </p>
              {renderOptionList(RELEASE_ERA_OPTIONS)}
            </div>
          )}
          {activeTab === 'watched_era' && (
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
                Personal timeline: The year you watched it does <em>not</em> exclude older anime released decades prior!
              </p>
              {renderOptionList(WATCHED_ERA_OPTIONS)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
