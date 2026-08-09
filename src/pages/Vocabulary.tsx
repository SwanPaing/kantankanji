import { useState, useMemo, useEffect, useCallback } from "react";
import { ALL_KANJI } from "../lib/kanjiData.js";
import KanjiDetailModal from "../components/KanjiDetailModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faVolumeHigh,
  faStar as faStarSolid,
  faRotateRight,
  faList,
  faGrip,
  faCopy,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faShuffle,
  faXmark,
  faBookmark,
  faBookOpen,
  faLayerGroup,
  faArrowRotateLeft,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";

type KanjiItem = typeof ALL_KANJI[number];

export interface VocabItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  jlpt_level: string;
  grade: string;
  parentKanji: KanjiItem;
}

export default function Vocabulary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"level" | "alphabetical" | "length">("level");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "flashcard">("grid");

  // Local storage bookmarks
  const [savedWordIds, setSavedWordIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("kantan_saved_vocab");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // UI state feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [selectedParentKanji, setSelectedParentKanji] = useState<KanjiItem | null>(null);

  // Flashcard mode states
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [reviewLaterIds, setReviewLaterIds] = useState<string[]>([]);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem("kantan_saved_vocab", JSON.stringify(savedWordIds));
    } catch (e) {
      console.error("Failed to save bookmarks:", e);
    }
  }, [savedWordIds]);

  // Extract and deduplicate all vocabulary items from ALL_KANJI
  const allVocabList = useMemo<VocabItem[]>(() => {
    const list: VocabItem[] = [];
    const seen = new Set<string>();

    ALL_KANJI.forEach((kanji) => {
      const exampleWords = kanji.example_words || [];
      exampleWords.forEach((ex) => {
        if (!ex.word || !ex.reading || !ex.meaning) return;
        const key = `${ex.word}_${ex.reading}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: key,
            word: ex.word,
            reading: ex.reading,
            meaning: ex.meaning,
            jlpt_level: kanji.jlpt_level || "N5",
            grade: kanji.grade || "1",
            parentKanji: kanji,
          });
        }
      });
    });

    return list;
  }, []);

  // Filter & Sort vocabulary
  const filteredVocab = useMemo(() => {
    const rawQuery = searchTerm.trim().toLowerCase();

    const toHiragana = (str: string) =>
      str.replace(/[\u30A1-\u30F6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

    const normalizedQuery = toHiragana(rawQuery).replace(/[\s\-_.,/()]/g, "");

    const result = allVocabList.filter((item) => {
      // Level filter
      if (selectedLevel !== "All" && item.jlpt_level !== selectedLevel) {
        return false;
      }

      // Bookmark filter
      if (showSavedOnly && !savedWordIds.includes(item.id)) {
        return false;
      }

      // Search matching
      if (!rawQuery) return true;

      const wordMatch = item.word.toLowerCase().includes(rawQuery);
      const meaningMatch = item.meaning.toLowerCase().includes(rawQuery);
      const kanjiMatch = item.parentKanji.character.includes(rawQuery);

      const normalizedReading = toHiragana(item.reading.toLowerCase()).replace(/[\s\-_.,/()]/g, "");
      const readingMatch = normalizedReading.includes(normalizedQuery);

      return wordMatch || meaningMatch || readingMatch || kanjiMatch;
    });

    // Sorting
    const levelOrder: Record<string, number> = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };

    return result.sort((a, b) => {
      if (sortBy === "level") {
        const orderA = levelOrder[a.jlpt_level] || 99;
        const orderB = levelOrder[b.jlpt_level] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.word.localeCompare(b.word, "ja");
      }
      if (sortBy === "alphabetical") {
        return a.reading.localeCompare(b.reading, "ja");
      }
      if (sortBy === "length") {
        return a.word.length - b.word.length;
      }
      return 0;
    });
  }, [allVocabList, searchTerm, selectedLevel, showSavedOnly, savedWordIds, sortBy]);

  // Reset flashcard index when filter changes
  useEffect(() => {
    setFlashcardIndex(0);
    setIsFlipped(false);
  }, [selectedLevel, searchTerm, showSavedOnly, sortBy]);

  // Audio Pronunciation (Text To Speech)
  const handleSpeak = useCallback((text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;

    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  }, []);

  // Toggle Bookmark
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedWordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Copy word to clipboard
  const handleCopy = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Level Badge Colors
  const levelColors: Record<string, { bg: string; text: string; border: string }> = {
    N5: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
    N4: { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-300" },
    N3: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
    N2: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
    N1: { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-300" },
  };

  // Level counts for stat chips
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allVocabList.length, N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
    allVocabList.forEach((v) => {
      if (counts[v.jlpt_level] !== undefined) {
        counts[v.jlpt_level]++;
      }
    });
    return counts;
  }, [allVocabList]);

  // Current flashcard item
  const currentFlashcard = filteredVocab[flashcardIndex];

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 1) % filteredVocab.length);
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev - 1 + filteredVocab.length) % filteredVocab.length);
  };

  const handleMarkMastered = (id: string) => {
    if (!masteredIds.includes(id)) {
      setMasteredIds((prev) => [...prev, id]);
      setReviewLaterIds((prev) => prev.filter((item) => item !== id));
    }
    handleNextFlashcard();
  };

  const handleMarkReviewLater = (id: string) => {
    if (!reviewLaterIds.includes(id)) {
      setReviewLaterIds((prev) => [...prev, id]);
      setMasteredIds((prev) => prev.filter((item) => item !== id));
    }
    handleNextFlashcard();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3b417c] via-[#464c91] to-[#2d3266] text-white py-12 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="absolute -right-10 -bottom-10 opacity-10 text-9xl font-black select-none pointer-events-none">
          語彙
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-3">
              <FontAwesomeIcon icon={faBookOpen} /> Japanese Vocabulary Bank
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Vocabulary Vault <span className="text-emerald-400 text-2xl sm:text-3xl font-bold font-serif ml-2">(日本語語彙)</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-200 max-w-2xl">
              Explore essential Japanese words, readings, and meanings linked directly to Joyo Kanji. Pronounce words aloud, bookmark for review, and study interactively with flashcards!
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-black text-white">{allVocabList.length}</span>
              <span className="text-xs text-slate-300 font-medium">Total Words</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-black text-amber-300">{savedWordIds.length}</span>
              <span className="text-xs text-slate-300 font-medium">Bookmarked</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-2xl font-black text-emerald-300">{filteredVocab.length}</span>
              <span className="text-xs text-slate-300 font-medium">Filtered</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Controls Header */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-4 top-[50%] -translate-y-1/2 text-slate-400 text-base"
              />
              <input
                type="text"
                placeholder="Search by Kanji (富士山), Reading (ふじさん), English (mountain), or Kanji component..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#464c91] focus:bg-white text-sm transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-[50%] -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Toggles */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bookmark Toggle */}
              <button
                onClick={() => setShowSavedOnly(!showSavedOnly)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all border ${
                  showSavedOnly
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                }`}
              >
                <FontAwesomeIcon icon={faStarSolid} className={showSavedOnly ? "text-white" : "text-amber-400"} />
                {showSavedOnly ? "Saved Only" : "Saved"} ({savedWordIds.length})
              </button>

              {/* View Mode Selectors */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === "grid" ? "bg-white text-[#464c91] shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FontAwesomeIcon icon={faGrip} className="w-4 h-4 px-1" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === "list" ? "bg-white text-[#464c91] shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FontAwesomeIcon icon={faList} className="w-4 h-4 px-1" />
                </button>
                <button
                  onClick={() => setViewMode("flashcard")}
                  title="Flashcard Deck Study"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    viewMode === "flashcard"
                      ? "bg-[#464c91] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Flashcards
                </button>
              </div>

              {/* Sorting Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "level" | "alphabetical" | "length")}
                className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#464c91]"
              >
                <option value="level">Sort: JLPT Level</option>
                <option value="alphabetical">Sort: Reading (あ-ん)</option>
                <option value="length">Sort: Word Length</option>
              </select>
            </div>
          </div>

          {/* JLPT Level Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <FontAwesomeIcon icon={faFilter} className="w-3 h-3" /> Level:
            </span>
            {["All", "N5", "N4", "N3", "N2", "N1"].map((lvl) => {
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? "bg-[#464c91] text-white border-[#3b417c] shadow-sm scale-105"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                  }`}
                >
                  {lvl} <span className="text-[10px] opacity-80">({levelCounts[lvl] ?? 0})</span>
                </button>
              );
            })}

            {(selectedLevel !== "All" || searchTerm || showSavedOnly) && (
              <button
                onClick={() => {
                  setSelectedLevel("All");
                  setSearchTerm("");
                  setShowSavedOnly(false);
                }}
                className="ml-auto text-xs text-[#464c91] font-semibold hover:underline flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faArrowRotateLeft} className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}

        {/* 1. FLASHCARD MODE */}
        {viewMode === "flashcard" && (
          <div className="max-w-2xl mx-auto my-6">
            {filteredVocab.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm px-6">
                <FontAwesomeIcon icon={faLayerGroup} className="text-5xl text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">No Vocabulary for Flashcard Study</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                  Try clearing your search terms or expanding your JLPT level filters to generate a study deck.
                </p>
                <button
                  onClick={() => {
                    setSelectedLevel("All");
                    setSearchTerm("");
                    setShowSavedOnly(false);
                  }}
                  className="mt-5 px-5 py-2.5 bg-[#464c91] text-white rounded-2xl text-xs font-bold hover:bg-[#3b417c] transition-all"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div>
                {/* Flashcard Header & Progress */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-[#464c91]/10 text-[#464c91] px-3 py-1 rounded-full">
                      Card {flashcardIndex + 1} of {filteredVocab.length}
                    </span>
                    {masteredIds.includes(currentFlashcard.id) && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheck} className="w-3 h-3" /> Mastered
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const randomIndex = Math.floor(Math.random() * filteredVocab.length);
                        setFlashcardIndex(randomIndex);
                        setIsFlipped(false);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-[#464c91] px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faShuffle} /> Shuffle Deck
                    </button>
                  </div>
                </div>

                {/* The Flashcard */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="relative min-h-[360px] bg-white rounded-3xl border-2 border-slate-200/90 shadow-xl p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:border-[#464c91]/40 group"
                >
                  {/* Card Top Level & Bookmark Row */}
                  <div className="w-full flex items-center justify-between text-xs">
                    <span
                      className={`px-3 py-1 rounded-full font-bold border ${
                        levelColors[currentFlashcard.jlpt_level]?.bg ?? "bg-slate-100"
                      } ${levelColors[currentFlashcard.jlpt_level]?.text ?? "text-slate-800"} ${
                        levelColors[currentFlashcard.jlpt_level]?.border ?? "border-slate-200"
                      }`}
                    >
                      JLPT {currentFlashcard.jlpt_level}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleSpeak(currentFlashcard.word, currentFlashcard.id, e)}
                        className={`p-2.5 rounded-full transition-all ${
                          speakingId === currentFlashcard.id
                            ? "bg-emerald-500 text-white scale-110"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                        title="Pronounce word"
                      >
                        <FontAwesomeIcon icon={faVolumeHigh} className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => toggleBookmark(currentFlashcard.id, e)}
                        className={`p-2.5 rounded-full transition-all ${
                          savedWordIds.includes(currentFlashcard.id)
                            ? "bg-amber-100 text-amber-500"
                            : "bg-slate-100 text-slate-400 hover:text-amber-500"
                        }`}
                        title="Bookmark word"
                      >
                        <FontAwesomeIcon icon={faStarSolid} className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Front vs Back Content */}
                  {!isFlipped ? (
                    <div className="my-auto py-8">
                      <h2 className="text-6xl sm:text-7xl font-black text-slate-900 tracking-wide mb-3 font-serif">
                        {currentFlashcard.word}
                      </h2>
                      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        (Tap to flip for reading & meaning)
                      </p>
                    </div>
                  ) : (
                    <div className="my-auto py-6 space-y-4 animate-fadeIn">
                      <div className="text-3xl font-bold text-[#464c91] font-sans">
                        {currentFlashcard.reading}
                      </div>

                      <div className="text-2xl font-black text-slate-900 max-w-md">
                        {currentFlashcard.meaning}
                      </div>

                      {/* Parent Kanji Breakdown Pill */}
                      <div className="pt-2 inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl text-xs text-slate-700">
                        <span className="font-semibold text-slate-500">Parent Kanji:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParentKanji(currentFlashcard.parentKanji);
                          }}
                          className="font-bold text-lg text-[#464c91] hover:underline"
                        >
                          {currentFlashcard.parentKanji.character}
                        </button>
                        <span className="text-slate-400">
                          (Onyomi: {currentFlashcard.parentKanji.onyomi?.join(", ") || "-"})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Flip Action Indicator */}
                  <div className="w-full text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5 pt-4 border-t border-slate-100">
                    <FontAwesomeIcon icon={faRotateRight} className="text-[#464c91]" />
                    {isFlipped ? "Showing Answer • Tap to Flip Back" : "Tap Card to Flip"}
                  </div>
                </div>

                {/* Bottom Navigation & Practice Controls */}
                <div className="flex items-center justify-between gap-3 mt-6">
                  <button
                    onClick={handlePrevFlashcard}
                    className="p-3 bg-white text-slate-700 rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all font-semibold text-sm flex items-center gap-1"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} /> Prev
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkReviewLater(currentFlashcard.id)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-all border border-rose-200"
                    >
                      Review Later
                    </button>
                    <button
                      onClick={() => handleMarkMastered(currentFlashcard.id)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all border border-emerald-200"
                    >
                      Mastered ✓
                    </button>
                  </div>

                  <button
                    onClick={handleNextFlashcard}
                    className="p-3 bg-[#464c91] text-white rounded-2xl shadow-sm hover:bg-[#3b417c] transition-all font-semibold text-sm flex items-center gap-1"
                  >
                    Next <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. GRID VIEW */}
        {viewMode === "grid" && (
          <div>
            {filteredVocab.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <FontAwesomeIcon icon={faBookmark} className="text-5xl text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">No Vocabulary Found</h3>
                <p className="text-sm text-slate-500 mt-2">
                  No vocabulary words matched your query or selected filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedLevel("All");
                    setSearchTerm("");
                    setShowSavedOnly(false);
                  }}
                  className="mt-6 px-6 py-2.5 bg-[#464c91] text-white rounded-2xl text-xs font-bold hover:bg-[#3b417c] transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredVocab.map((item) => {
                  const isSaved = savedWordIds.includes(item.id);
                  const isSpeaking = speakingId === item.id;
                  const isCopied = copiedId === item.id;
                  const badge = levelColors[item.jlpt_level] || levelColors.N5;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-[#464c91]/30 transition-all duration-200 flex flex-col justify-between group relative"
                    >
                      {/* Top Row: JLPT Level & Actions */}
                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {item.jlpt_level}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleSpeak(item.word, item.id, e)}
                            className={`p-2 rounded-xl transition-all ${
                              isSpeaking
                                ? "bg-emerald-500 text-white"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            }`}
                            title="Pronounce word"
                          >
                            <FontAwesomeIcon icon={faVolumeHigh} className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleCopy(`${item.word} (${item.reading}) - ${item.meaning}`, item.id, e)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            title="Copy to clipboard"
                          >
                            <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={`w-3.5 h-3.5 ${isCopied ? "text-emerald-600" : ""}`} />
                          </button>

                          <button
                            onClick={(e) => toggleBookmark(item.id, e)}
                            className={`p-2 rounded-xl transition-all ${
                              isSaved ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-slate-100"
                            }`}
                            title="Save word"
                          >
                            <FontAwesomeIcon icon={faStarSolid} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Word Header */}
                      <div className="my-2">
                        <h3 className="text-3xl font-black text-slate-900 font-serif group-hover:text-[#464c91] transition-colors">
                          {item.word}
                        </h3>
                        <p className="text-sm font-semibold text-[#464c91] mt-0.5">
                          {item.reading}
                        </p>
                      </div>

                      {/* Meaning */}
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 my-2 leading-relaxed">
                        {item.meaning}
                      </p>

                      {/* Parent Kanji Link Pill */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <span className="text-[11px] font-semibold text-slate-400">Kanji:</span>
                        <button
                          onClick={() => setSelectedParentKanji(item.parentKanji)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-[#464c91] text-[#464c91] hover:text-white text-xs font-bold transition-all"
                          title="View Kanji detail modal"
                        >
                          <span>{item.parentKanji.character}</span>
                          <span className="text-[10px] opacity-70">Detail</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. LIST VIEW */}
        {viewMode === "list" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredVocab.length === 0 ? (
              <div className="text-center py-16 px-6">
                <FontAwesomeIcon icon={faBookmark} className="text-4xl text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">No matching words found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Header Row */}
                <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-3 sm:col-span-2">Word</div>
                  <div className="col-span-3 sm:col-span-3">Reading</div>
                  <div className="col-span-4 sm:col-span-4">Meaning</div>
                  <div className="hidden sm:block sm:col-span-1 text-center">Level</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Actions</div>
                </div>

                {/* Rows */}
                {filteredVocab.map((item) => {
                  const isSaved = savedWordIds.includes(item.id);
                  const isSpeaking = speakingId === item.id;
                  const isCopied = copiedId === item.id;
                  const badge = levelColors[item.jlpt_level] || levelColors.N5;

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/80 transition-colors group text-sm"
                    >
                      <div className="col-span-3 sm:col-span-2 font-black text-slate-900 font-serif text-lg group-hover:text-[#464c91]">
                        {item.word}
                      </div>

                      <div className="col-span-3 sm:col-span-3 font-semibold text-[#464c91] text-xs sm:text-sm">
                        {item.reading}
                      </div>

                      <div className="col-span-4 sm:col-span-4 text-xs sm:text-sm text-slate-700 font-medium line-clamp-1">
                        {item.meaning}
                      </div>

                      <div className="hidden sm:block sm:col-span-1 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {item.jlpt_level}
                        </span>
                      </div>

                      <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleSpeak(item.word, item.id, e)}
                          className={`p-2 rounded-xl transition-all ${
                            isSpeaking
                              ? "bg-emerald-500 text-white"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                          }`}
                          title="Pronounce word"
                        >
                          <FontAwesomeIcon icon={faVolumeHigh} className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleCopy(`${item.word} (${item.reading}) - ${item.meaning}`, item.id, e)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
                          title="Copy word"
                        >
                          <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className={`w-3.5 h-3.5 ${isCopied ? "text-emerald-600" : ""}`} />
                        </button>

                        <button
                          onClick={(e) => toggleBookmark(item.id, e)}
                          className={`p-2 rounded-xl transition-all ${
                            isSaved ? "text-amber-500 bg-amber-50" : "text-slate-300 hover:text-amber-500 hover:bg-slate-200/60"
                          }`}
                          title="Save word"
                        >
                          <FontAwesomeIcon icon={faStarSolid} className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedParentKanji(item.parentKanji)}
                          className="hidden lg:inline-flex px-2 py-1 bg-slate-100 hover:bg-[#464c91] text-[#464c91] hover:text-white rounded-lg text-xs font-bold transition-all ml-1"
                        >
                          {item.parentKanji.character}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parent Kanji Detail Modal Popup */}
      {selectedParentKanji && (
        <KanjiDetailModal
          kanji={selectedParentKanji}
          selected={false}
          onSelect={() => {}}
          onClose={() => setSelectedParentKanji(null)}
        />
      )}
    </div>
  );
}
