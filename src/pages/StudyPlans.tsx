import { useMemo, useState } from "react";
import Quiz, { type QuizItemSource } from "../components/Quiz";
import KanjiDetailModal from "../components/KanjiDetailModal";
import { N5_KANJI, N4_KANJI, N3_KANJI, N2_KANJI, N1_KANJI } from "../lib/kanjiData.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoltLightning,
  faBook,
  faChevronDown,
  faChevronRight,
  faCircleCheck,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KanjiItem = QuizItemSource & {
  grade?: string | null;
  stroke_count?: number;
  example_words?: Array<{ word: string; reading: string; meaning: string }>;
};

type LevelDef = {
  id: string;
  name: string;
  subtitle: string;
  items: KanjiItem[];
  color: string;
  border: string;
  badge: string;
  accent: string;
  btn: string;
  headerBg: string;
};

type SessionRef = {
  levelId: string;
  sessionIndex: number;
  quiz?: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "kantankanji_completed_sessions";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function getCompletedSessions(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markSessionCompleted(key: string) {
  const completed = getCompletedSessions();
  completed.add(key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

const LEVELS: LevelDef[] = [
  {
    id: "n5",
    name: "JLPT N5",
    subtitle: "Beginner",
    items: N5_KANJI as KanjiItem[],
    color: "from-green-50 to-emerald-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800",
    accent: "text-green-700",
    btn: "bg-green-600 hover:bg-green-700",
    headerBg: "bg-green-50",
  },
  {
    id: "n4",
    name: "JLPT N4",
    subtitle: "Elementary",
    items: N4_KANJI as KanjiItem[],
    color: "from-blue-50 to-sky-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    accent: "text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
    headerBg: "bg-blue-50",
  },
  {
    id: "n3",
    name: "JLPT N3",
    subtitle: "Intermediate",
    items: N3_KANJI as KanjiItem[],
    color: "from-yellow-50 to-amber-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800",
    accent: "text-yellow-700",
    btn: "bg-yellow-500 hover:bg-yellow-600",
    headerBg: "bg-yellow-50",
  },
  {
    id: "n2",
    name: "JLPT N2",
    subtitle: "Advanced",
    items: N2_KANJI as KanjiItem[],
    color: "from-orange-50 to-red-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-800",
    accent: "text-orange-700",
    btn: "bg-orange-600 hover:bg-orange-700",
    headerBg: "bg-orange-50",
  },
  {
    id: "n1",
    name: "JLPT N1",
    subtitle: "Master",
    items: N1_KANJI as KanjiItem[],
    color: "from-red-50 to-rose-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    accent: "text-red-700",
    btn: "bg-red-600 hover:bg-red-700",
    headerBg: "bg-red-50",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const StudyPlans = () => {
  const [activeSession, setActiveSession] = useState<SessionRef | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    () => new Set(["n5"])
  );
  const [completedSessions, setCompletedSessions] = useState(
    () => getCompletedSessions()
  );
  const [detailKanji, setDetailKanji] = useState<KanjiItem | null>(null);

  // Precompute sessions for every level
  const sessionsByLevel = useMemo(() => {
    const map: Record<string, KanjiItem[][]> = {};
    for (const level of LEVELS) {
      map[level.id] = chunkArray(level.items, 10);
    }
    return map;
  }, []);

  const toggleLevel = (id: string) => {
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSessionComplete = () => {
    if (!activeSession) return;
    const key = `${activeSession.levelId}-${activeSession.sessionIndex}`;
    markSessionCompleted(key);
    setCompletedSessions(getCompletedSessions());
    setActiveSession(null);
  };

  // Current level & session data
  const currentLevel = activeSession
    ? LEVELS.find((l) => l.id === activeSession.levelId) ?? LEVELS[0]
    : null;
  const currentSessionItems = activeSession
    ? sessionsByLevel[activeSession.levelId]?.[activeSession.sessionIndex] ?? []
    : [];

  // ---- Quiz view ----
  if (activeSession?.quiz && currentLevel) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() =>
              setActiveSession({ ...activeSession, quiz: false })
            }
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[18px] font-medium text-black transition hover:border-[#464c91] hover:bg-[#464c91] hover:text-white"
          >
            ← Back to session
          </button>
          <Quiz
            title={`${currentLevel.name} — Session ${activeSession.sessionIndex + 1}`}
            subtitle={`Practice the ${currentSessionItems.length} kanji from this session`}
            items={currentSessionItems}
            onBack={() => {
              handleSessionComplete();
            }}
          />
        </div>
      </div>
    );
  }

  // ---- Session detail view ----
  if (activeSession && currentLevel) {
    const sessionKey = `${activeSession.levelId}-${activeSession.sessionIndex}`;
    const isCompleted = completedSessions.has(sessionKey);

    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          type="button"
          onClick={() => setActiveSession(null)}
          className="mb-6 rounded-full border border-slate-200 bg-white px-4 py-2 text-[18px] font-medium text-black transition hover:border-[#464c91] hover:bg-[#464c91] hover:text-white"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to study plans
        </button>

        {/* Session header */}
        <div
          className={`rounded-2xl border ${currentLevel.border} bg-gradient-to-r ${currentLevel.color} p-6 shadow-sm`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[15px] font-bold px-2 py-0.5 rounded-full ${currentLevel.badge}`}
                >
                  {currentLevel.id.toUpperCase()}
                </span>
                <span className={`text-[14px] font-semibold ${currentLevel.accent}`}>
                  {currentLevel.subtitle}
                </span>
                {isCompleted && (
                  <span className="ml-2 text-emerald-600">
                    <FontAwesomeIcon icon={faCircleCheck} /> Completed
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Session {activeSession.sessionIndex + 1}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Study these {currentSessionItems.length} kanji, then test your
                knowledge with a quiz.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveSession({ ...activeSession, quiz: true })
              }
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-semibold transition-colors ${currentLevel.btn} shrink-0`}
            >
              <FontAwesomeIcon icon={faBoltLightning} />
              Start Quiz
            </button>
          </div>
        </div>

        {/* Kanji grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {currentSessionItems.map((item) => (
            <button
              key={item.character}
              type="button"
              onClick={() => setDetailKanji(item)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-[#464c91] hover:shadow-md"
            >
              <h3
                className="text-5xl font-bold text-slate-900"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.character}
              </h3>
              <p className="mt-3 text-sm text-slate-600 truncate">
                {(item.meanings || []).slice(0, 2).join(", ")}
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                {(item.onyomi || []).slice(0, 1).map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                  >
                    {r}
                  </span>
                ))}
                {(item.kunyomi || []).slice(0, 1).map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Kanji detail modal */}
        {detailKanji && (
          <KanjiDetailModal
            kanji={detailKanji}
            selected={false}
            onSelect={() => { }}
            onClose={() => setDetailKanji(null)}
          />
        )}
      </div>
    );
  }

  // ---- Session list view (default) ----
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 grid justify-center">
      <div className="mb-8 ">
        <h1 className="mt-2 text-5xl font-semibold text-slate-900">
          Study Plans
        </h1>
        <p className="mt-3 text-[#464c91] text-lg">
          Master kanji step by step — 10 kanji per session, with quizzes to test your knowledge.
        </p>
      </div>

      <div className="grid gap-4 w-xs sm:w-xl lg:w-2xl xl:w-4xl">
        {LEVELS.map((level) => {
          const sessions = sessionsByLevel[level.id];
          const isExpanded = expandedLevels.has(level.id);
          const completedCount = sessions.filter((_, i) =>
            completedSessions.has(`${level.id}-${i}`)
          ).length;

          return (
            <div
              key={level.id}
              className={`rounded-2xl border ${level.border} bg-white shadow-sm overflow-hidden`}
            >
              {/* Level header */}
              <button
                type="button"
                onClick={() => toggleLevel(level.id)}
                className={`w-full ${level.headerBg} p-5 text-left transition hover:brightness-95`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon
                      icon={isExpanded ? faChevronDown : faChevronRight}
                      className={`text-sm ${level.accent}`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[15px] font-bold px-2 py-0.5 rounded-full ${level.badge}`}
                        >
                          {level.id.toUpperCase()}
                        </span>
                        <span
                          className={`text-[14px] font-semibold ${level.accent}`}
                        >
                          {level.subtitle}
                        </span>
                      </div>
                      <h2 className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">
                        {level.name}
                      </h2>
                    </div>
                  </div>
                  <div className="text-left sm:text-right ml-8 sm:ml-0">
                    <p className="text-sm text-slate-600">
                      {sessions.length} sessions · {level.items.length} kanji
                    </p>
                    {completedCount > 0 && (
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        <FontAwesomeIcon icon={faCircleCheck} className="mr-1" />
                        {completedCount}/{sessions.length} completed
                      </p>
                    )}
                  </div>
                </div>
              </button>

              {/* Sessions grid */}
              {isExpanded && (
                <div className="p-3 sm:p-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
                  {sessions.map((sessionItems, idx) => {
                    const sessionKey = `${level.id}-${idx}`;
                    const isDone = completedSessions.has(sessionKey);

                    return (
                      <button
                        key={sessionKey}
                        type="button"
                        onClick={() =>
                          setActiveSession({
                            levelId: level.id,
                            sessionIndex: idx,
                          })
                        }
                        className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${isDone
                            ? "border-emerald-200 bg-emerald-50/50"
                            : `${level.border} bg-gradient-to-r ${level.color}`
                          }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon
                              icon={faBook}
                              className={`text-sm ${isDone ? "text-emerald-600" : level.accent}`}
                            />
                            <span className="font-semibold text-slate-900">
                              Session {idx + 1}
                            </span>
                          </div>
                          {isDone && (
                            <FontAwesomeIcon
                              icon={faCircleCheck}
                              className="text-emerald-500"
                            />
                          )}
                        </div>

                        {/* Preview kanji */}
                        <div className="flex flex-wrap gap-1.5">
                          {sessionItems.slice(0, 5).map((k) => (
                            <span
                              key={k.character}
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-base sm:text-lg text-black font-semibold bg-white/70 rounded-lg shadow-sm"
                              style={{ fontFamily: "var(--font-display)" }}
                            >
                              {k.character}
                            </span>
                          ))}
                          {sessionItems.length > 5 && (
                            <span className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs text-slate-500 bg-white/50 rounded-lg">
                              +{sessionItems.length - 5}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                          {sessionItems.length} kanji
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyPlans;
