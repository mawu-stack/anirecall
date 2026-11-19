// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
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
import VisualExamples from '../components/VisualExamples';
import VisualClueHelper from '../components/VisualClueHelper';
import CelebrationModal from '../components/CelebrationModal';
import RefineModal from '../components/RefineModal';
import Footer from '../components/Footer';

export default function Home() {
  const [currentMode, setCurrentMode] = useState('story'); // 'story' | 'character' | 'screenshot' | 'mystery' | 'history'
  const [searchMode, setSearchMode] = useState('story'); // 'story' | 'title'
  const [query, setQuery] = useState('');
  const [clues, setClues] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [excludedIds, setExcludedIds] = useState([]);
  const [answeredCategories, setAnsweredCategories] = useState([]);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [reasoningSummary, setReasoningSummary] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [providerStatus, setProviderStatus] = useState('missing_credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & sub-flows
  const [comparisonData, setComparisonData] = useState(null);
  const [confirmedAnime, setConfirmedAnime] = useState(null);
  const [celebrationAnime, setCelebrationAnime] = useState(null);
  const [refiningCandidate, setRefiningCandidate] = useState(null);
  const [showSimilarVibes, setShowSimilarVibes] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  // Race condition protection: ignore stale async responses
  const activeRequestIdRef = useRef(0);

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

    const updated = [newItem, ...historyItems.filter(h => (h.anime.uid || h.anime.id) !== (anime.uid || anime.id))];
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
    setAnsweredCategories([]);
    setPreviousQuestions([]);
    setCurrentMode('story');
    executeSearch({
      customQuery: historyItem.originalQuery || '',
      customClues: historyItem.cluesSnapshot || [],
      customExcluded: [],
      isRefinement: true
    });
  };

  /**
   * Explicit New Search: resets all prior clues, exclusions, follow-up history, and stale summaries.
   */
  const handleNewSearch = (newQuery = '', overrideMode = null) => {
    const q = typeof newQuery === 'string' ? newQuery : '';
    setQuery(q);
    if (overrideMode) {
      setSearchMode(overrideMode);
    }
    setClues([]);
    setCandidates([]);
    setExcludedIds([]);
    setAnsweredCategories([]);
    setPreviousQuestions([]);
    setFollowUpQuestion(null);
    setComparisonData(null);
    setReasoningSummary('');
    setErrorMessage('');

    if (q.trim()) {
      executeSearch({
        customQuery: q,
        customClues: [],
        customExcluded: [],
        customMode: overrideMode || searchMode,
        isNewSearch: true
      });
    }
  };

  /**
   * Mode switch handler: starts a clean new search when switching between Story and Title modes
   */
  const handleChangeSearchMode = (newMode) => {
    setSearchMode(newMode);
    if (clues.length > 0 || candidates.length > 0) {
      handleNewSearch(query, newMode);
    }
  };

  /**
   * Main agent search execution with race condition protection.
   */
  const executeSearch = async ({
    customQuery = null,
    customClues = null,
    customExcluded = null,
    customMode = null,
    followUpAnswer = null,
    isRefinement = false,
    isNewSearch = false
  } = {}) => {
    const q = customQuery !== null ? customQuery : query;
    const activeClues = customClues !== null ? customClues : clues;
    const activeExcluded = customExcluded !== null ? customExcluded : excludedIds;
    const activeMode = customMode !== null ? customMode : searchMode;

    if (!q.trim() && activeClues.length === 0) return;

    // Increment request ID to invalidate any prior in-flight requests
    const currentReqId = ++activeRequestIdRef.current;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/agent/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          existingClues: isNewSearch ? [] : activeClues,
          excludedIds: isNewSearch ? [] : activeExcluded,
          followUpAnswer,
          mode: activeMode,
          answeredCategories: isNewSearch ? [] : answeredCategories,
          previousQuestions: isNewSearch ? [] : previousQuestions,
          isRefinement: isRefinement && !isNewSearch
        })
      });

      const json = await res.json();

      // Guard: Ignore response if a newer search began while this request was in flight
      if (currentReqId !== activeRequestIdRef.current) {
        return;
      }

      if (json.success && json.data) {
        setClues(json.data.clues || []);
        setCandidates(json.data.candidates || []);
        setFollowUpQuestion(json.data.followUpQuestion || null);
        setReasoningSummary(json.data.reasoningSummary || '');
        setIsDemoMode(Boolean(json.data.isDemoMode));
        if (json.data.providerStatus) {
          setProviderStatus(json.data.providerStatus);
        }
        if (json.data.answeredCategories) setAnsweredCategories(json.data.answeredCategories);
        if (json.data.previousQuestions) setPreviousQuestions(json.data.previousQuestions);
      } else {
        setErrorMessage(json.error || 'Failed to process memory clues.');
      }
    } catch (err) {
      if (currentReqId === activeRequestIdRef.current) {
        console.error('Search request failed:', err);
        setErrorMessage(err.message || 'Network error communicating with the AniRecall agent.');
      }
    } finally {
      if (currentReqId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Follow-up question answer
  const handleAnswerQuestion = (answerData) => {
    executeSearch({ followUpAnswer: answerData, isRefinement: true });
  };

  // Follow-up question skip
  const handleSkipQuestion = () => {
    setFollowUpQuestion(null);
  };

  // Confirm candidate ("Found it!")
  const handleConfirmCandidate = (candidate) => {
    setConfirmedAnime(candidate);
    setCelebrationAnime(candidate);
    saveToHistory(candidate);
  };

  // Exclude candidate ("That's not it")
  const handleExcludeCandidate = (candidate) => {
    const candidateId = candidate.uid || candidate.id;
    const updatedExcluded = [...excludedIds, candidateId];
    setExcludedIds(updatedExcluded);
    // Re-filter immediately excluding this candidate
    executeSearch({ customExcluded: updatedExcluded, isRefinement: true });
  };

  // Refine candidate ("Close, but...") opens accessible inline RefineModal
  const handleOpenRefineModal = (candidate) => {
    setRefiningCandidate(candidate);
  };

  const handleApplyRefinement = (newClue) => {
    const updatedClues = [...clues, newClue];
    setClues(updatedClues);
    executeSearch({ customClues: updatedClues, isRefinement: true });
  };

  // Compare 2 candidates side-by-side
  const handleCompareCandidates = async (cand1, cand2) => {
    try {
      const res = await fetch('/api/agent/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id1: cand1.uid || cand1.id,
          id2: cand2.uid || cand2.id,
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

  const hasActiveSearch = clues.length > 0 || candidates.length > 0 || excludedIds.length > 0;

  return (
    <div className="app-container">
      {/* Header & Global Mode Navigation */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        isDemoMode={isDemoMode}
        providerStatus={providerStatus}
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
            onSearch={() => executeSearch({ isNewSearch: clues.length === 0 })}
            onNewSearch={handleNewSearch}
            hasActiveSearch={hasActiveSearch}
            isLoading={isLoading}
            searchMode={searchMode}
            onChangeSearchMode={handleChangeSearchMode}
          />

          {/* Visual Clue Selector Helper ("Help Me Remember") */}
          <VisualClueHelper
            clues={clues}
            onUpdateClues={(newClues) => {
              setClues(newClues);
              executeSearch({ customClues: newClues, isRefinement: true });
            }}
          />

          {/* Image-backed Example Searches (Prominent when starting a search) */}
          {candidates.length === 0 && !isLoading && (
            <VisualExamples
              onSelectExample={(exampleText) => {
                handleNewSearch(exampleText);
              }}
            />
          )}

          {/* Desktop Two-Column Layout */}
          <div className="main-workspace">
            {/* Left Column: Clue Management & Agent Conversation */}
            <section aria-label="Memory Clues and Follow-up Questions">
              <ClueManager
                clues={clues}
                onUpdateClues={(newClues) => {
                  setClues(newClues);
                  executeSearch({ customClues: newClues, isRefinement: true });
                }}
                onRefreshSearch={() => executeSearch({ isRefinement: true })}
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
                      executeSearch({ customExcluded: [], isRefinement: true });
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
                onRefineCandidate={handleOpenRefineModal}
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
            setCurrentMode('story');
            handleNewSearch(title, 'title');
          }}
        />
      )}

      {/* Mode View: Screenshot Search */}
      {currentMode === 'screenshot' && (
        <ScreenshotSearch
          onSelectAnime={(title) => {
            setCurrentMode('story');
            handleNewSearch(title, 'title');
          }}
        />
      )}

      {/* Mode View: Mystery Mode */}
      {currentMode === 'mystery' && (
        <MysteryMode
          onSelectAnime={(title) => {
            setCurrentMode('story');
            handleNewSearch(title, 'title');
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
      {refiningCandidate && (
        <RefineModal
          candidate={refiningCandidate}
          onClose={() => setRefiningCandidate(null)}
          onAddRefinement={handleApplyRefinement}
        />
      )}

      {celebrationAnime && (
        <CelebrationModal
          anime={celebrationAnime}
          onClose={() => setCelebrationAnime(null)}
          onOpenSimilarVibes={() => {
            setCelebrationAnime(null);
            setShowSimilarVibes(true);
          }}
        />
      )}

      {comparisonData && (
        <CompareModal
          comparisonData={comparisonData}
          onClose={() => setComparisonData(null)}
          onConfirmCandidate={handleConfirmCandidate}
        />
      )}

      {showSimilarVibes && confirmedAnime && (
        <SimilarVibes
          confirmedAnime={confirmedAnime}
          onClose={() => setShowSimilarVibes(false)}
          onSelectRecommended={(title) => {
            handleNewSearch(title, 'title');
          }}
        />
      )}

      {/* Global Application Footer with Developer Credits */}
      <Footer />
    </div>
  );
}
