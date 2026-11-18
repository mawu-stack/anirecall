// components/ClueManager.jsx
import React, { useState } from 'react';
import { Tag, Plus, Check, HelpCircle, X, Edit2, SlidersHorizontal } from 'lucide-react';

const CATEGORY_COLORS = {
  character: { label: 'Character', color: '#F472B6' },
  setting: { label: 'Setting', color: '#38BDF8' },
  scene: { label: 'Scene', color: '#A78BFA' },
  genre: { label: 'Genre', color: '#34D399' },
  approx_year: { label: 'Release Era', color: '#FBBF24' },
  watched_year: { label: 'Watched In', color: '#FB923C' },
  format: { label: 'Format', color: '#818CF8' },
  platform: { label: 'Platform', color: '#2DD4BF' }
};

export default function ClueManager({ clues, onUpdateClues, onRefreshSearch, isLoading }) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('scene');
  const [newText, setNewText] = useState('');
  const [newConfidence, setNewConfidence] = useState('sure');

  const toggleConfidence = (clueId) => {
    const updated = clues.map(c => {
      if (c.id === clueId) {
        return {
          ...c,
          confidence: c.confidence === 'sure' ? 'maybe' : 'sure'
        };
      }
      return c;
    });
    onUpdateClues(updated);
  };

  const removeClue = (clueId) => {
    const updated = clues.filter(c => c.id !== clueId);
    onUpdateClues(updated);
  };

  const startEditing = (clue) => {
    setEditingId(clue.id);
    setEditText(clue.text);
  };

  const saveEdit = (clueId) => {
    if (!editText.trim()) {
      removeClue(clueId);
    } else {
      const updated = clues.map(c => {
        if (c.id === clueId) {
          return { ...c, text: editText.trim() };
        }
        return c;
      });
      onUpdateClues(updated);
    }
    setEditingId(null);
  };

  const handleAddClue = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newClue = {
      id: `clue-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: newCategory,
      text: newText.trim(),
      confidence: newConfidence
    };

    onUpdateClues([...clues, newClue]);
    setNewText('');
    setShowAddForm(false);
  };

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <h3 style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem'
        }}>
          <SlidersHorizontal size={15} color="var(--accent-violet-light)" />
          Extracted Memory Clues ({clues.length})
        </h3>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
            aria-label="Add custom clue"
          >
            <Plus size={13} />
            Add Clue
          </button>

          {clues.length > 0 && (
            <button
              type="button"
              onClick={onRefreshSearch}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }}
              aria-label="Re-filter results using clues"
            >
              Re-filter
            </button>
          )}
        </div>
      </div>

      {/* Add clue form modal / expandable section */}
      {showAddForm && (
        <form onSubmit={handleAddClue} style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          marginBottom: '0.85rem'
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.6rem',
                fontSize: '0.82rem'
              }}
            >
              <option value="character">Character</option>
              <option value="scene">Scene Fragment</option>
              <option value="setting">Setting / World</option>
              <option value="genre">Genre / Theme</option>
              <option value="approx_year">Release Year (Anime)</option>
              <option value="watched_year">Watched In (Your Year)</option>
              <option value="format">Format (Movie/TV)</option>
              <option value="platform">Platform (Netflix/etc.)</option>
            </select>

            <select
              value={newConfidence}
              onChange={(e) => setNewConfidence(e.target.value)}
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.6rem',
                fontSize: '0.82rem'
              }}
            >
              <option value="sure">Certain (Sure)</option>
              <option value="maybe">Uncertain (Maybe)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              placeholder="e.g. Red ribbon in hair, 2011, hospital roof..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.84rem'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}>
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-ghost"
              style={{ padding: '0.35rem 0.5rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Empty State */}
      {clues.length === 0 ? (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No clues extracted yet. Enter a description above or click "Add Clue" to specify what you recall.
        </p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {clues.map((clue) => {
            const catMeta = CATEGORY_COLORS[clue.category] || { label: clue.category, color: 'var(--accent-cyan)' };
            const isEditing = editingId === clue.id;

            return (
              <div
                key={clue.id}
                className={`clue-chip ${clue.confidence}`}
                style={{
                  background: 'var(--bg-input)',
                  padding: isEditing ? '0.2rem' : '0.35rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {/* Category label */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: catMeta.color,
                    letterSpacing: '0.04em'
                  }}
                >
                  {catMeta.label}:
                </span>

                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(clue.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-focus)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.82rem'
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(clue.id)}
                      className="btn-ghost"
                      style={{ padding: '0.15rem', color: 'var(--success-text)' }}
                      title="Save edit"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-ghost"
                      style={{ padding: '0.15rem', color: 'var(--text-muted)' }}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '0.84rem' }}>{clue.text}</span>

                    {/* Confidence toggle */}
                    <button
                      type="button"
                      onClick={() => toggleConfidence(clue.id)}
                      style={{
                        background: clue.confidence === 'sure' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: clue.confidence === 'sure' ? 'var(--accent-cyan)' : 'var(--warning-text)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.12rem 0.4rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title={clue.confidence === 'sure' ? 'Marked as certain. Click to make uncertain.' : 'Marked as soft preference. Click to make certain.'}
                    >
                      {clue.confidence === 'sure' ? 'Sure' : 'Maybe'}
                    </button>

                    {/* Edit icon */}
                    <button
                      type="button"
                      onClick={() => startEditing(clue)}
                      className="btn-ghost"
                      style={{ padding: '0.1rem', color: 'var(--text-muted)' }}
                      title="Edit clue text"
                      aria-label="Edit clue"
                    >
                      <Edit2 size={12} />
                    </button>

                    {/* Remove icon */}
                    <button
                      type="button"
                      onClick={() => removeClue(clue.id)}
                      className="btn-ghost"
                      style={{ padding: '0.1rem', color: 'var(--text-muted)' }}
                      title="Remove clue"
                      aria-label="Remove clue"
                    >
                      <X size={13} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
