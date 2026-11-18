// components/MysteryMode.jsx
import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronRight, AlertTriangle, CheckCircle2, RotateCcw, Eye, Trophy } from 'lucide-react';

export default function MysteryMode({ onSelectAnime }) {
  const [gameData, setGameData] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [revealedSpoiler, setRevealedSpoiler] = useState(false);
  const [userGuess, setUserGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [hasGivenUp, setHasGivenUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);

  const fetchNewGame = async () => {
    setIsLoading(true);
    setIsCorrect(false);
    setHasGivenUp(false);
    setCurrentStageIndex(0);
    setRevealedSpoiler(false);
    setUserGuess('');

    try {
      const res = await fetch('/api/mystery/game');
      const json = await res.json();
      if (json.success) {
        setGameData(json.data);
      }
    } catch (err) {
      console.error('Failed to load mystery game:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewGame();
  }, []);

  const handleNextStage = () => {
    if (gameData && currentStageIndex < gameData.stages.length - 1) {
      setCurrentStageIndex(prev => prev + 1);
    }
  };

  const handleGuess = (e) => {
    e.preventDefault();
    if (!userGuess.trim() || !gameData) return;

    const normalizedGuess = userGuess.trim().toLowerCase();
    const titleMatch = gameData.answerSummary.title.toLowerCase().includes(normalizedGuess) ||
                       (gameData.answerSummary.englishTitle && gameData.answerSummary.englishTitle.toLowerCase().includes(normalizedGuess));

    if (titleMatch) {
      setIsCorrect(true);
      // Award score based on stage: Stage 1 = 50 pts, Stage 2 = 40, Stage 3 = 30, Stage 4 = 20, Stage 5 = 10
      const earned = Math.max(10, 50 - currentStageIndex * 10);
      setScore(prev => prev + earned);
    } else {
      alert(`"${userGuess}" is not correct! Try revealing the next clue.`);
    }
  };

  const handleGiveUp = () => {
    setHasGivenUp(true);
  };

  return (
    <div className="fade-in" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={22} color="var(--accent-violet)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Mystery Anime Guessing Game
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-input)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <Trophy size={14} color="#FBBF24" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Score: {score} pts
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Can you identify the secret anime from progressive memory clues? Clues get easier as you advance, but grant fewer points!
        </p>

        {isLoading && (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading new mystery challenge...
          </p>
        )}

        {gameData && !isLoading && (
          <div>
            {/* Clue stages timeline */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {gameData.stages.map((st, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: i <= currentStageIndex ? 'var(--accent-violet)' : 'var(--border-subtle)',
                    transition: 'background 0.2s ease'
                  }}
                  title={st.label}
                />
              ))}
            </div>

            {/* Revealed clues list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {gameData.stages.slice(0, currentStageIndex + 1).map((st, i) => {
                if (st.isSpoiler && !revealedSpoiler && !isCorrect && !hasGivenUp) {
                  return (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} color="var(--warning-text)" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--warning-text)' }}>
                          Stage 5: Major Plot Twist (Spoiler Shielded)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRevealedSpoiler(true)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                      >
                        <Eye size={12} />
                        Reveal Spoiler Clue
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className="fade-in"
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                        Stage {st.stage}: {st.label}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Difficulty: {st.difficulty}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {st.clue}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Guess input form */}
            {!isCorrect && !hasGivenUp && (
              <form onSubmit={handleGuess} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Guess the anime title..."
                  value={userGuess}
                  onChange={(e) => setUserGuess(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.15rem' }}>
                  Submit Guess
                </button>
              </form>
            )}

            {/* Stage controls & Give Up */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!isCorrect && !hasGivenUp && currentStageIndex < gameData.stages.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.82rem' }}
                >
                  Reveal Next Clue ({gameData.stages.length - 1 - currentStageIndex} left)
                  <ChevronRight size={14} />
                </button>
              )}

              {!isCorrect && !hasGivenUp && (
                <button
                  type="button"
                  onClick={handleGiveUp}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem', color: 'var(--danger-text)' }}
                >
                  Give Up & Reveal Answer
                </button>
              )}
            </div>

            {/* Victory / Reveal Card */}
            {(isCorrect || hasGivenUp) && (
              <div
                className="panel fade-in"
                style={{
                  marginTop: '1.25rem',
                  borderLeft: `4px solid ${isCorrect ? 'var(--success-border)' : 'var(--warning-border)'}`,
                  background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  {isCorrect ? (
                    <>
                      <CheckCircle2 size={20} color="var(--success-text)" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success-text)', margin: 0 }}>
                        Correct! You Identified the Anime!
                      </h3>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={20} color="var(--warning-text)" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--warning-text)', margin: 0 }}>
                        The Secret Anime was:
                      </h3>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <img
                    src={gameData.answerSummary.posterUrl}
                    alt={gameData.answerSummary.title}
                    style={{ width: '90px', height: '130px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {gameData.answerSummary.title}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
                      {gameData.answerSummary.year} • {gameData.answerSummary.englishTitle}
                    </p>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      {gameData.answerSummary.synopsis}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={fetchNewGame}
                    className="btn btn-primary"
                    style={{ fontSize: '0.84rem' }}
                  >
                    <RotateCcw size={14} />
                    Play Another Round
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectAnime(gameData.answerSummary.title)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.84rem' }}
                  >
                    Search Clues For This Anime
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
