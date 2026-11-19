// components/RefineModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, SlidersHorizontal, Plus, Sparkles, Check } from 'lucide-react';

export default function RefineModal({ candidate, onClose, onAddRefinement }) {
  const [correctionText, setCorrectionText] = useState('');
  const [category, setCategory] = useState('scene');
  const [confidence, setConfidence] = useState('sure');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!candidate) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!correctionText.trim()) return;

    onAddRefinement({
      id: `clue-refine-${Date.now()}`,
      category,
      text: correctionText.trim(),
      confidence
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="refine-modal-title"
    >
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '92%' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <SlidersHorizontal size={18} color="var(--accent-violet)" />
            <h2 id="refine-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Refine Search & Correct Clues
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '0.3rem' }}
            aria-label="Close refinement modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Candidate Summary */}
        <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.15rem', alignItems: 'center' }}>
          <img
            src={candidate.posterUrl}
            alt={candidate.title}
            style={{ width: '42px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}
          />
          <div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Refining from candidate:
            </p>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.1rem 0' }}>
              {candidate.title}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--accent-violet-light)' }}>
              Tell the agent what is close, and what is different.
            </p>
          </div>
        </div>

        {/* Refinement Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="refine-input"
              style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}
            >
              What is different from "{candidate.title}"?
            </label>
            <textarea
              id="refine-input"
              ref={textareaRef}
              rows={3}
              value={correctionText}
              onChange={(e) => setCorrectionText(e.target.value)}
              placeholder="e.g., 'Wrong weapon: mine used a chainsaw, not a sword', 'Mine was released around 2016, not 2006', 'Main character was an elf with white twin pigtails'..."
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* Clue Category & Certainty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Clue Type:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.65rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem'
                }}
              >
                <option value="scene">Specific Scene / Plot Element</option>
                <option value="character">Character Appearance / Trait</option>
                <option value="approx_year">Release Era / Year</option>
                <option value="format">Format (Movie vs TV Series)</option>
                <option value="setting">Setting / World Environment</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                Your Certainty:
              </label>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setConfidence('sure')}
                  style={{
                    flex: 1,
                    background: confidence === 'sure' ? 'var(--success-border)' : 'var(--bg-card)',
                    color: confidence === 'sure' ? '#FFFFFF' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Sure (Hard Filter)
                </button>
                <button
                  type="button"
                  onClick={() => setConfidence('maybe')}
                  style={{
                    flex: 1,
                    background: confidence === 'maybe' ? 'var(--accent-violet)' : 'var(--bg-card)',
                    color: confidence === 'maybe' ? '#FFFFFF' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Maybe (Soft Preference)
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ fontSize: '0.84rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!correctionText.trim()}
              className="btn btn-primary"
              style={{ fontSize: '0.84rem', opacity: !correctionText.trim() ? 0.6 : 1 }}
            >
              <Plus size={14} />
              Add Clue & Re-Rank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
