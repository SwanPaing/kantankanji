
import { useMemo, useState } from "react";
import Quiz, { type QuizItemSource } from "../components/Quiz";
import { ALL_KANJI, N1_KANJI, N2_KANJI, N3_KANJI, N4_KANJI, N5_KANJI } from "../lib/kanjiData.js";
import {
  addCustomQuizSet,
  clearSelectedQuizCharacters,
  deleteCustomQuizSet,
  getCustomQuizSets,
  getCustomQuizSetItems,
  getSelectedQuizItems,
} from "../lib/customQuiz";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoltLightning } from "@fortawesome/free-solid-svg-icons";

type QuizSetDefinition = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  items: QuizItemSource[];
  color: string;
  border: string;
  badge: string;
  accent: string;
  btn: string;
};

const QUIZ_SETS: QuizSetDefinition[] = [
  {
    id: "random",
    name: "Random Quiz Sets",
    subtitle: "Mixed",
    description: "A mixed set of kanji and vocabulary questions drawn from all available levels.",
    items: ALL_KANJI,
    color: 'from-purple-50 to-purple-100',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-800',
    accent: 'text-purple-700',
    btn: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    id: "n5",
    name: "JLPT N5",
    subtitle: "Beginner",
    description: "Starter kanji and vocabulary prompts for the most common beginner level.",
    items: N5_KANJI,
    color: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    accent: 'text-green-700',
    btn: 'bg-green-600 hover:bg-green-700',
  },
  {
    id: "n4",
    name: "JLPT N4",
    subtitle: "Elementary",
    description: "Build confidence with everyday vocabulary and core elementary kanji.",
    items: N4_KANJI,
    color: 'from-blue-50 to-sky-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    accent: 'text-blue-700',
    btn: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    id: "n3",
    name: "JLPT N3",
    subtitle: "Intermediate",
    description: "Practice broader vocabulary and more intermediate kanji usage.",
    items: N3_KANJI,
    color: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    accent: 'text-yellow-700',
    btn: 'bg-yellow-500 hover:bg-yellow-600',
  },
  {
    id: "n2",
    name: "JLPT N2",
    subtitle: "Advanced",
    description: "Tackle more demanding vocabulary and kanji recognition with a advanced level set.",
    items: N2_KANJI,
    color: 'from-orange-50 to-red-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-800',
    accent: 'text-orange-700',
    btn: 'bg-orange-600 hover:bg-orange-700',
  },
  {
    id: "n1",
    name: "JLPT N1",
    subtitle: "Master",
    description: "Challenge yourself with highest-level kanji and vocabulary prompts.",
    items: N1_KANJI,
    color: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    accent: 'text-red-700',
    btn: 'bg-red-600 hover:bg-red-700',
  },
];

const QuizSets = () => {
  const [activeSet, setActiveSet] = useState<QuizSetDefinition | null>(null);
  const [savedSets, setSavedSets] = useState(() => getCustomQuizSets());
  const [newSetTitle, setNewSetTitle] = useState("");
  const [pendingCustomItems, setPendingCustomItems] = useState(() => getSelectedQuizItems());
  const hasPendingCustomSelection = pendingCustomItems.length > 0;

  const customSavedSets = useMemo<QuizSetDefinition[]>(() => {
    return savedSets.map((set) => ({
      id: set.id,
      name: set.title,
      subtitle: `${set.characters.length} kanji`,
      description: "Saved custom quiz set",
      items: getCustomQuizSetItems(set),
      color: 'from-zinc-100 to-zinc-200',
      border: 'border-zinc-200',
      badge: 'bg-zinc-300 text-zinc-800',
      accent: 'text-zinc-700',
      btn: 'bg-zinc-600 hover:bg-zinc-700',
    }));
  }, [savedSets]);

  const selectedSet = useMemo(() => {
    if (!activeSet) {
      return QUIZ_SETS[0];
    }

    return [...customSavedSets, ...QUIZ_SETS].find((set) => set.id === activeSet.id) ?? QUIZ_SETS[0];
  }, [activeSet, customSavedSets]);

  const handleDeleteSavedSet = (id: string) => {
    const nextSets = deleteCustomQuizSet(id);
    setSavedSets(nextSets);
    if (activeSet?.id === id) {
      setActiveSet(null);
    }
  };

  const handleSavePendingCustomSet = () => {
    if (!newSetTitle.trim() || !hasPendingCustomSelection) {
      return;
    }

    const nextSets = addCustomQuizSet(newSetTitle.trim(), pendingCustomItems);
    setSavedSets(nextSets);
    setNewSetTitle("");
    clearSelectedQuizCharacters();
    setPendingCustomItems([]);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 grid justify-center">
      <div className="mb-8">
        <h1 className="mt-2 text-5xl font-semibold text-slate-900">Quiz Sets</h1>
        <p className="mt-3 text-[#464c91] text-lg">
          Choose a level to start a multiple-choice quiz for kanji, vocabulary, meanings, readings, or both.
        </p>
      </div>

      {!activeSet ? (
        <div className="grid gap-4 justify-center">
          {hasPendingCustomSelection ? (
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Save custom quiz set</h2>
                  <p className="mt-1 text-sm text-slate-600">Finish creating your custom set from the selected kanji you chose on the Home page.</p>
                </div>
                <span className="rounded-full bg-[#464c91] px-3 py-1 text-sm font-semibold text-white">{pendingCustomItems.length} kanji selected</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={newSetTitle}
                  onChange={(event) => setNewSetTitle(event.target.value)}
                  placeholder="Enter a title for your quiz set"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-black outline-none focus:border-[#464c91] focus:ring-2 focus:ring-[#464c91]/30"
                />
                <button
                  type="button"
                  onClick={handleSavePendingCustomSet}
                  className="rounded-xl bg-[#464c91] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3c437d]"
                >
                  Save Set
                </button>
              </div>
            </div>
          ) : null}

          {customSavedSets.length > 0 ? (
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Saved custom quiz sets</h2>
                  <p className="mt-1 text-sm text-slate-600">Start a quiz from any saved set or remove sets you no longer need.</p>
                </div>
              </div>

              <div className="mt-4">
                {customSavedSets.map((set) => (
                  <div
                    key={set.id}
                    className={`w-full max-w-4xl rounded-2xl my-4 border ${set.border} bg-linear-to-r ${set.color} p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#464c91] hover:shadow-md`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex gap-2 shrink-0">
                        {set.items.slice(0, 4).map((k) => (
                          <span
                            key={k.character}
                            className="w-10 h-10 flex items-center justify-center text-2xl text-black font-semibold bg-white/70 rounded-lg shadow-sm"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {k.character}
                          </span>
                        ))}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[15px] font-bold px-2 py-0.5 rounded-full ${set.badge}`}>Custon</span>
                          
                          <span className="text-[13px] text-black text-muted-foreground ml-auto">{set.items.length} kanji</span>
                        </div>
                        <h2 className="mt-3 text-xl font-semibold text-slate-900">{set.name}</h2>
                        <p className="mt-2 text-sm text-slate-600">{set.description}</p>
                      </div>
                      <div className="grid gap-8 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedSet(set.id)}
                          className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-gray-200 transition"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSet(set)}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${set.btn}`}
                        >
                          <FontAwesomeIcon icon={faBoltLightning} />
                          Start Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                  // <div key={set.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  //   <div className="flex flex-col gap-3">
                  //     <div className="flex items-center justify-between gap-3">
                  //       <div>
                  //         <p className="font-semibold text-slate-900">{set.name}</p>
                  //         <p className="text-sm text-slate-600">{set.subtitle}</p>
                  //       </div>
                  //       <button
                  //         type="button"
                  //         onClick={() => handleDeleteSavedSet(set.id)}
                  //         className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  //       >
                  //         Delete
                  //       </button>
                  //     </div>
                  //     <p className="text-sm text-slate-600">{set.description}</p>
                  //     <div className="flex flex-wrap gap-2">
                  //       {set.items.slice(0, 4).map((item) => (
                  //         <span key={item.character} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-2xl font-semibold text-slate-900 shadow-sm">
                  //           {item.character}
                  //         </span>
                  //       ))}
                  //     </div>
                  //     <button
                  //       type="button"
                  //       onClick={() => setActiveSet(set)}
                  //       className="mt-2 rounded-xl bg-[#464c91] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3c437d]"
                  //     >
                  //       Start Quiz
                  //     </button>
                  //   </div>
                  // </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-600">No saved custom quiz sets yet. Create one from the Home page by selecting kanji and saving the set.</p>
            </div>
          )}

          {QUIZ_SETS.map((set) => (
            <div
              key={set.id}
              className={`w-full max-w-4xl rounded-2xl border ${set.border} bg-linear-to-r ${set.color} p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#464c91] hover:shadow-md`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex gap-2 shrink-0">
                  {set.items.slice(0, 4).map((k) => (
                    <span
                      key={k.character}
                      className="w-10 h-10 flex items-center justify-center text-2xl text-black font-semibold bg-white/70 rounded-lg shadow-sm"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {k.character}
                    </span>
                  ))}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[15px] font-bold px-2 py-0.5 rounded-full ${set.badge}`}>{set.id}</span>
                    <span className={`text-[14px] font-semibold ${set.accent}`}>{set.subtitle}</span>
                    <span className="text-[13px] text-black text-muted-foreground ml-auto">{set.items.length} kanji</span>
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">{set.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{set.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSet(set)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-colors ${set.btn}`}
                  >
                    <FontAwesomeIcon icon={faBoltLightning} />
                    Start Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setActiveSet(null)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[18px] font-medium text-black transition hover:border-[#464c91] hover:bg-[#464c91] hover:text-white"
          >
            ← Back to quiz sets
          </button>
          <Quiz title={selectedSet.name} subtitle={selectedSet.description} items={selectedSet.items} onBack={() => setActiveSet(null)} />
        </div>
      )}
    </div>
  );
};

export default QuizSets;
