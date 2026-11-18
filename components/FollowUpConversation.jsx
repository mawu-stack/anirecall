// components/FollowUpConversation.jsx
import React, { useState } from 'react';
import { HelpCircle, Send, ArrowRight } from 'lucide-react';

export default function FollowUpConversation({
  questionData,
  onAnswerQuestion,
  onSkipQuestion,
  isLoading
}) {
  const [customAnswer, setCustomAnswer] = useState('');

  if (!questionData) return null;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customAnswer.trim() && !isLoading) {
      onAnswerQuestion({
        text: customAnswer.trim(),
        category: questionData.category || 'scene'
      });
      setCustomAnswer('');
    }
  };

  return (
    <div
      className="panel fade-in"
      style={{
        borderLeft: '4px solid var(--accent-cyan)',
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(19, 27, 46, 0.95))'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
        <HelpCircle size={16} color="var(--accent-cyan)" />
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Agent Follow-Up Question (Optional)
        </span>
      </div>

      <p style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.85rem', lineHeight: 1.4 }}>
        {questionData.question}
      </p>

      {/* Quick Answer Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.85rem' }}>
        {questionData.options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => onAnswerQuestion({
              text: option,
              category: questionData.category || 'scene'
            })}
            style={{
              background: option === "I don't remember" ? 'rgba(255, 255, 255, 0.05)' : 'rgba(6, 182, 212, 0.12)',
              border: `1px solid ${option === "I don't remember" ? 'var(--border-subtle)' : 'rgba(6, 182, 212, 0.35)'}`,
              color: option === "I don't remember" ? 'var(--text-secondary)' : 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.8rem',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = option === "I don't remember" ? 'var(--border-subtle)' : 'rgba(6, 182, 212, 0.35)';
              e.currentTarget.style.background = option === "I don't remember" ? 'rgba(255, 255, 255, 0.05)' : 'rgba(6, 182, 212, 0.12)';
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Free-text response input + Skip / Search Anyway */}
      <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Or type what you remember..."
          value={customAnswer}
          onChange={(e) => setCustomAnswer(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 0.75rem',
            color: 'var(--text-primary)',
            fontSize: '0.84rem'
          }}
        />

        <button
          type="submit"
          disabled={isLoading || !customAnswer.trim()}
          className="btn btn-primary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
          aria-label="Send answer"
        >
          <Send size={13} />
          Answer
        </button>

        <button
          type="button"
          onClick={onSkipQuestion}
          className="btn btn-ghost"
          style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
          title="Proceed with current results without answering"
        >
          Skip Question
        </button>
      </form>
    </div>
  );
}
