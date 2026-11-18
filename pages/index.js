// pages/index.js
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ClueManager from '../components/ClueManager';
import CandidateList from '../components/CandidateList';
import FollowUpConversation from '../components/FollowUpConversation';
import CompareModal from '../components/CompareModal';
import CharacterFinder from '../components/CharacterFinder';
import ScreenshotSearch from '../components/ScreenshotSearch';
import MysteryMode from '../components/MysteryMode';
import SavedHistory from '../components/SavedHistory';
import SimilarVibes from '../components/SimilarVibes';

export default function Home() {
  const [currentMode, setCurrentMode] = useState('story'); // 'story' | 'character' | 'screenshot' | 'mystery' | 'history'
  const [searchMode, setSearchMode] = useState('story'); // 'story' | 'title'
  const [query, setQuery] = useState('');
  const [clues, setClues] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [excludedIds, setExcludedIds] = useState([]);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [reasoningSummary, setReasoningSummary] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & sub-flows
  const [comparisonData, setComparisonData] = useState(null);
  const [confirmedAnime, setConfirmedAnime] = useState(null);
  const [showSimilarVibes, setShowSimilarVibes] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  // Load saved history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('anirecall_history');
      if (stored) {
        setHistoryItems(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (anime) => {
    const newItem = {
      id: `saved-${Date.now()}`,
      anime,
      originalQuery: query || clues.map(c => c.text).join(', '),
      cluesSnapshot: clues,
      timestamp: Date.now()
    };

    const updated = [newItem, ...historyItems.filter(h => h.anime.id !== anime.id)];
    setHistoryItems(updated);
    try {
      localStorage.setItem('anirecall_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const deleteHistoryItem = (id) => {
    const updated = historyItems.filter(h => h.id !== id);
    setHistoryItems(updated);
    try {
      localStorage.setItem('anirecall_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete from localStorage:', e);
    }
  };

  const clearAllHistory = () => {
    if (confirm('Are you sure you want to delete all saved discoveries from this browser?')) {
      setHistoryItems([]);
      try {
        localStorage.removeItem('anirecall_history');
      } catch (e) {}
    }
  };

  // Reopen a saved search from history
  const handleReopenSearch = (historyItem) => {
    setQuery(historyItem.originalQuery || '');
    setClues(historyItem.cluesSnapshot || []);
    setExcludedIds([]);
    setCurrentMode('story');
    // Trigger agent search with reopened clues
    executeSearch({
      customQuery: historyItem.originalQuery || '',
      customClues: historyItem.cluesSnapshot || []
    });
  };

  // Main agent search execution
  const executeSearch = async ({
    customQuery = null,
    customClues = null,
    customExcluded = null,
    followUpAnswer = null
  } = {}) => {
    const q = customQuery !== null ? customQuery : query;
    const activeClues = customClues !== null ? customClues : clues;
    const activeExcluded = customExcluded !== null ? customExcluded : excludedIds;

    if (!q.trim() && activeClues.length === 0) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/agent/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          existingClues: activeClues,
          excludedIds: activeExcluded,
          followUpAnswer,
          mode: searchMode
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setClues(json.data.clues || []);
        setCandidates(json.data.candidates || []);
        setFollowUpQuestion(json.data.followUpQuestion || null);
        setReasoningSummary(json.data.reasoningSummary || '');
        setIsDemoMode(Boolean(json.data.isDemoMode));
      } else {
        setErrorMessage(json.error || 'Failed to process memory clues.');
      }
    } catch (err) {
      console.error('Search request failed:', err);
      setErrorMessage(err.message || 'Network error communicating with the AniRecall agent.');
    } finally {
      setIsLoading(false);
    }
  };

  // Follow-up question answer
  const handleAnswerQuestion = (answerData) => {
    executeSearch({ followUpAnswer: answerData });
  };

  // Follow-up question skip
  const handleSkipQuestion = () => {
    setFollowUpQuestion(null);
  };

  // Confirm candidate ("Found it!")
  const handleConfirmCandidate = (candidate) => {
    setConfirmedAnime(candidate);
    saveToHistory(candidate);
    setShowSimilarVibes(true);
  };

  // Exclude candidate ("That's not it")
  const handleExcludeCandidate = (candidate) => {
    const updatedExcluded = [...excludedIds, candidate.id];
    setExcludedIds(updatedExcluded);
    // Re-filter immediately excluding this candidate
    executeSearch({ customExcluded: updatedExcluded });
  };

  // Refine candidate ("Close, but...")
  const handleRefineCandidate = (candidate) => {
    const correction = prompt(
      `What makes "${candidate.title}" close, and what is different? (e.g. "Wrong weapon, mine had a chainsaw", "Mine was a 2016 film, not a series")`
    );
    if (correction && correction.trim()) {
      const newClue = {
        id: `clue-${Date.now()}`,
        category: 'scene',
        text: correction.trim(),
        confidence: 'sure'
      };
      const updatedClues = [...clues, newClue];
      setClues(updatedClues);
      executeSearch({ customClues: updatedClues });
    }
  };

  // Compare 2 candidates side-by-side
  const handleCompareCandidates = async (cand1, cand2) => {
    try {
      const res = await fetch('/api/agent/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id1: cand1.id,
          id2: cand2.id,
          clues
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setComparisonData(json.data);
      }
    } catch (err) {
      alert('Could not generate comparison: ' + err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Header & Global Mode Navigation */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        isDemoMode={isDemoMode}
      />

      {/* Error state alert */}
      {errorMessage && (
        <div
          className="fade-in"
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="btn-ghost"
            style={{ color: 'var(--danger-text)' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode View: Story / Scene Search (Default) */}
      {currentMode === 'story' && (
        <main>
          {/* Top Search Area */}
          <SearchBar
            query={query}
            onChangeQuery={(val) => setQuery(val)}
            onSearch={() => executeSearch()}
            isLoading={isLoading}
            searchMode={searchMode}
            onChangeSearchMode={(m) => setSearchMode(m)}
          />

          {/* Desktop Two-Column Layout */}
          <div className="main-workspace">
            {/* Left Column: Clue Management & Agent Conversation */}
            <section aria-label="Memory Clues and Follow-up Questions">
              <ClueManager
                clues={clues}
                onUpdateClues={(newClues) => {
                  setClues(newClues);
                  executeSearch({ customClues: newClues });
                }}
                onRefreshSearch={() => executeSearch()}
                isLoading={isLoading}
              />

              {followUpQuestion && (
                <FollowUpConversation
                  questionData={followUpQuestion}
                  onAnswerQuestion={handleAnswerQuestion}
                  onSkipQuestion={handleSkipQuestion}
                  isLoading={isLoading}
                />
              )}

              {/* Exclusions counter */}
              {excludedIds.length > 0 && (
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.95rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>Excluded {excludedIds.length} candidate(s) from current search.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setExcludedIds([]);
                      executeSearch({ customExcluded: [] });
                    }}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.76rem', padding: '0.2rem 0.5rem' }}
                  >
                    Reset Exclusions
                  </button>
                </div>
              )}
            </section>

            {/* Right Column: Ranked Grounded Results */}
            <section aria-label="Candidate Results">
              <CandidateList
                candidates={candidates}
                onConfirmCandidate={handleConfirmCandidate}
                onExcludeCandidate={handleExcludeCandidate}
                onRefineCandidate={handleRefineCandidate}
                onCompareCandidates={handleCompareCandidates}
                reasoningSummary={reasoningSummary}
                isLoading={isLoading}
              />
            </section>
          </div>
        </main>
      )}

      {/* Mode View: Character Finder */}
      {currentMode === 'character' && (
        <CharacterFinder
          onSelectAnimeFromCharacter={(title) => {
            setQuery(`Character from ${title}`);
            setCurrentMode('story');
            executeSearch({ customQuery: `Character from ${title}` });
          }}
        />
      )}

      {/* Mode View: Screenshot Search */}
      {currentMode === 'screenshot' && (
        <ScreenshotSearch
          onSelectAnime={(title) => {
            setQuery(title);
            setCurrentMode('story');
            executeSearch({ customQuery: title });
          }}
        />
      )}

      {/* Mode View: Mystery Mode */}
      {currentMode === 'mystery' && (
        <MysteryMode
          onSelectAnime={(title) => {
            setQuery(title);
            setCurrentMode('story');
            executeSearch({ customQuery: title });
          }}
        />
      )}

      {/* Mode View: Saved History */}
      {currentMode === 'history' && (
        <SavedHistory
          historyItems={historyItems}
          onReopenSearch={handleReopenSearch}
          onDeleteItem={deleteHistoryItem}
          onClearAll={clearAllHistory}
        />
      )}

      {/* Modals */}
      {comparisonData && (
        <CompareModal
          comparisonData={comparisonData}
          onClose={() => setComparisonData(null)}
        />
      )}

      {showSimilarVibes && confirmedAnime && (
        <SimilarVibes
          confirmedAnime={confirmedAnime}
          onClose={() => setShowSimilarVibes(false)}
          onSelectRecommended={(title) => {
            setQuery(title);
            executeSearch({ customQuery: title });
          }}
        />
      )}
    </div>
  );
}
