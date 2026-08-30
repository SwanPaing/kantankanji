import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ALL_KANJI } from "../lib/kanjiData.js";

export type QuizItemSource = {
  character: string;
  jlpt_level?: string;
  meanings?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  example_words?: Array<{ word: string; reading: string; meaning: string }>;
};

type ContentMode = "kanji" | "vocabulary" | "mixed";
type PromptMode = "meaning" | "reading" | "mixed";
type QuizCount = "10" | "20" | "all";

type QuizSettings = {
  contentMode: ContentMode;
  promptMode: PromptMode;
  questionCount: QuizCount;
};

type QuizQuestion = {
  id: string;
  prompt: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: "kanji" | "vocabulary";
  kind: "meaning" | "reading";
};

type QuizProps = {
  title: string;
  subtitle: string;
  items: QuizItemSource[];
  onBack?: () => void;
};

// Global pools extracted once from ALL_KANJI to guarantee rich distractors
const GLOBAL_MEANINGS_POOL = Array.from(
  new Set(ALL_KANJI.flatMap((k) => k.meanings ?? []).filter(Boolean))
);
const GLOBAL_READINGS_POOL = Array.from(
  new Set(ALL_KANJI.flatMap((k) => [...(k.onyomi ?? []), ...(k.kunyomi ?? [])]).filter(Boolean))
);
const GLOBAL_VOCAB_READING_POOL = Array.from(
  new Set(
    ALL_KANJI.flatMap((k) => k.example_words ?? [])
      .map((w) => w.reading)
      .filter(Boolean)
  )
);
const GLOBAL_VOCAB_MEANING_POOL = Array.from(
  new Set(
    ALL_KANJI.flatMap((k) => k.example_words ?? [])
      .map((w) => w.meaning)
      .filter(Boolean)
  )
);

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

// Script detection helpers
const isKatakana = (s: string) => /^[\u30A0-\u30FF\u30FC\s]+$/.test(s);



const KUNYOMI_ROOTS = [
  "あ", "い", "う", "え", "お",
  "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ",
  "た", "ち", "つ", "て", "と",
  "な", "に", "ぬ", "ね", "の",
  "は", "ひ", "ふ", "へ", "ほ",
  "ま", "み", "む", "め", "も",
  "や", "ゆ", "よ",
  "ら", "り", "る", "れ", "ろ",
  "わ", "が", "ぎ", "ぐ", "げ", "ご",
  "ざ", "じ", "ず", "ぜ", "ぞ",
  "だ", "で", "ど",
  "ば", "び", "ぶ", "べ", "ぼ",
  "くら", "なら", "つら", "ひら", "あら", "から", "てら",
  "やま", "かわ", "うみ", "もり", "はな", "みず", "つき", "ひ", "かぜ", "そら",
  "ひと", "ふた", "みっ", "よっ", "いつ", "むっ", "なな", "やっ", "ここの", "とお"
];

const ONYOMI_ROOTS = [
  "コウ", "ショウ", "トウ", "ソウ", "キョウ", "ジョウ", "ドウ", "ホウ", "ボウ",
  "カン", "サン", "セン", "テン", "ゲン", "レン", "シン", "ジン", "キン", "ギン",
  "サイ", "カイ", "タイ", "ダイ", "ライ", "バイ", "マイ",
  "シ", "ジ", "チ", "キ", "ギ", "ニ", "ヒ", "ビ", "リ",
  "カ", "ガ", "タ", "ダ", "ナ", "ハ", "バ", "マ", "ラ",
  "ク", "グ", "ツ", "ド", "ブ", "プ", "フ", "ル",
  "イチ", "ニチ", "ガク", "ロク", "ハチ", "ジュウ", "リツ", "ショク", "ブツ"
];

const ONYOMI_HIRAGANA_ROOTS = [
  "こう", "しょう", "とう", "そう", "きょう", "じょう", "どう", "ほう", "ぼう",
  "かん", "さん", "せん", "てん", "げん", "れん", "しん", "じん", "きん", "ぎん",
  "さい", "かい", "たい", "だい", "らい", "ばい", "まい",
  "し", "じ", "ち", "き", "ぎ", "に", "ひ", "び", "り",
  "か", "が", "た", "だ", "な", "は", "ば", "ま", "ら"
];

type ReadingAffixes = {
  isKat: boolean;
  tildePrefix: string;
  tildeSuffix: string;
  isPrefixHyphen: boolean;
  isSuffixHyphen: boolean;
  midHyphenSuffix: string;
  dotSuffix: string;
  leadingKana: string;
  trailingKana: string;
};

const extractReadingAffixes = (answer: string, questionWord = ""): ReadingAffixes => {
  const isKat = isKatakana(answer.replace(/[~～〜\-.\s\/]/g, ""));

  let tildePrefix = "";
  if (answer.startsWith("~") || answer.startsWith("～") || answer.startsWith("〜")) {
    tildePrefix = answer[0];
  } else if (questionWord.startsWith("~") || questionWord.startsWith("～") || questionWord.startsWith("〜")) {
    tildePrefix = questionWord[0];
  }

  let tildeSuffix = "";
  if (answer.endsWith("~") || answer.endsWith("～") || answer.endsWith("〜")) {
    tildeSuffix = answer[answer.length - 1];
  } else if (questionWord.endsWith("~") || questionWord.endsWith("～") || questionWord.endsWith("〜")) {
    tildeSuffix = questionWord[questionWord.length - 1];
  }

  const isPrefixHyphen = answer.startsWith("-");
  const isSuffixHyphen = answer.endsWith("-");
  const hasMidHyphen = !isPrefixHyphen && !isSuffixHyphen && answer.includes("-");
  const hasDot = answer.includes(".");

  let midHyphenSuffix = "";
  if (hasMidHyphen) {
    midHyphenSuffix = answer.substring(answer.lastIndexOf("-")); // e.g. '-べる'
  }
  let dotSuffix = "";
  if (hasDot) {
    dotSuffix = answer.substring(answer.lastIndexOf(".")); // e.g. '.つ'
  }

  let leadingKana = "";
  let trailingKana = "";

  if (questionWord && !hasMidHyphen && !hasDot && !isPrefixHyphen && !isSuffixHyphen) {
    const cleanWord = questionWord.replace(/^[~～〜]/, "").replace(/[~～〜]$/, "");
    const cleanAns = answer.replace(/^[~～〜]/, "").replace(/[~～〜]$/, "");

    const leadMatch = cleanWord.match(/^[\u3040-\u309F\u30A0-\u30FF]+/);
    if (leadMatch && cleanAns.startsWith(leadMatch[0])) {
      leadingKana = leadMatch[0];
    }

    const trailMatch = cleanWord.match(/[\u3040-\u309F\u30A0-\u30FF]+$/);
    if (trailMatch && cleanAns.endsWith(trailMatch[0])) {
      trailingKana = trailMatch[0];
    }
  }

  return {
    isKat,
    tildePrefix,
    tildeSuffix,
    isPrefixHyphen,
    isSuffixHyphen,
    midHyphenSuffix,
    dotSuffix,
    leadingKana,
    trailingKana,
  };
};

const buildSmartReadingChoices = (
  answer: string,
  localPool: string[],
  globalPool: string[],
  questionWord = ""
): string[] => {
  const aff = extractReadingAffixes(answer, questionWord);
  const choices = new Set<string>([answer]);

  const applyTemplate = (stem: string): string | null => {
    let cleanStem = stem.replace(/^[~～〜\-.\s\/]+/, "").replace(/[~～〜\-.\s\/]+$/, "");
    if (aff.leadingKana && cleanStem.startsWith(aff.leadingKana)) {
      cleanStem = cleanStem.slice(aff.leadingKana.length);
    }
    if (aff.trailingKana && cleanStem.endsWith(aff.trailingKana)) {
      cleanStem = cleanStem.slice(0, cleanStem.length - aff.trailingKana.length);
    }
    if (aff.midHyphenSuffix && cleanStem.endsWith(aff.midHyphenSuffix.replace(/^-/, ""))) {
      cleanStem = cleanStem.slice(0, cleanStem.length - aff.midHyphenSuffix.length + 1);
    }
    if (aff.dotSuffix && cleanStem.endsWith(aff.dotSuffix.replace(/^\./, ""))) {
      cleanStem = cleanStem.slice(0, cleanStem.length - aff.dotSuffix.length + 1);
    }
    if (!cleanStem) return null;

    if (aff.isPrefixHyphen) return `-${cleanStem}`;
    if (aff.isSuffixHyphen) return `${cleanStem}-`;
    if (aff.midHyphenSuffix) return `${cleanStem}${aff.midHyphenSuffix}`;
    if (aff.dotSuffix) return `${cleanStem}${aff.dotSuffix}`;

    let res = cleanStem;
    if (aff.leadingKana) res = `${aff.leadingKana}${res}`;
    if (aff.trailingKana) res = `${res}${aff.trailingKana}`;
    if (aff.tildePrefix) res = `${aff.tildePrefix}${res}`;
    if (aff.tildeSuffix) res = `${res}${aff.tildeSuffix}`;
    return res;
  };

  const pool = Array.from(new Set([...localPool, ...globalPool].filter(Boolean)));

  // Step 1: Natural exact matches from pool that already share the exact pattern
  const naturalMatches = pool.filter((cand) => {
    if (cand.toLowerCase() === answer.toLowerCase()) return false;
    const candAff = extractReadingAffixes(cand, "");
    if (aff.isKat !== candAff.isKat) return false;
    if (aff.tildePrefix && aff.tildePrefix !== candAff.tildePrefix) return false;
    if (aff.tildeSuffix && aff.tildeSuffix !== candAff.tildeSuffix) return false;
    if (aff.isPrefixHyphen !== candAff.isPrefixHyphen) return false;
    if (aff.isSuffixHyphen !== candAff.isSuffixHyphen) return false;
    if (aff.midHyphenSuffix && aff.midHyphenSuffix !== candAff.midHyphenSuffix) return false;
    if (aff.dotSuffix && aff.dotSuffix !== candAff.dotSuffix) return false;
    if (aff.leadingKana && !cand.startsWith(aff.leadingKana)) return false;
    if (aff.trailingKana && !cand.endsWith(aff.trailingKana)) return false;
    return true;
  });

  for (const match of shuffle(naturalMatches)) {
    choices.add(match);
    if (choices.size >= 4) break;
  }

  // Step 2: Pool items adapted with template (for vocab readings / tildes)
  if (choices.size < 4 && !aff.midHyphenSuffix && !aff.dotSuffix && !aff.isPrefixHyphen && !aff.isSuffixHyphen) {
    for (const cand of shuffle(pool)) {
      if (cand.toLowerCase() === answer.toLowerCase()) continue;
      const formatted = applyTemplate(cand);
      if (formatted && formatted.toLowerCase() !== answer.toLowerCase() && !choices.has(formatted)) {
        if (aff.isKat === isKatakana(formatted.replace(/[~～〜\-.\s\/]/g, ""))) {
          choices.add(formatted);
          if (choices.size >= 4) break;
        }
      }
    }
  }

  // Step 3: High-quality synthetic roots fallback
  if (choices.size < 4) {
    const roots = aff.isKat ? ONYOMI_ROOTS : aff.tildeSuffix ? ONYOMI_HIRAGANA_ROOTS : KUNYOMI_ROOTS;
    for (const root of shuffle(roots)) {
      const formatted = applyTemplate(root);
      if (formatted && formatted.toLowerCase() !== answer.toLowerCase() && !choices.has(formatted)) {
        choices.add(formatted);
        if (choices.size >= 4) break;
      }
    }
  }

  return shuffle(Array.from(choices));
};

type MeaningAffixes = {
  tildePrefix: string;
  tildeSuffix: string;
  dotsPrefix: string;
  dotsSuffix: string;
  counterPrefix: string;
  isVerb: boolean;
};

const extractMeaningAffixes = (answer: string): MeaningAffixes => {
  const trimmed = answer.trim();

  let tildePrefix = "";
  if (trimmed.startsWith("~ ") || trimmed.startsWith("～ ")) {
    tildePrefix = trimmed.slice(0, 2);
  } else if (trimmed.startsWith("~") || trimmed.startsWith("～") || trimmed.startsWith("〜")) {
    tildePrefix = trimmed[0];
  }

  let tildeSuffix = "";
  if (trimmed.endsWith(" ~") || trimmed.endsWith(" ～")) {
    tildeSuffix = trimmed.slice(-2);
  } else if (trimmed.endsWith("~") || trimmed.endsWith("～") || trimmed.endsWith("〜")) {
    tildeSuffix = trimmed[trimmed.length - 1];
  }

  const dotsPrefix = trimmed.startsWith("...") ? "..." : "";
  const dotsSuffix = trimmed.endsWith("...") ? "..." : "";

  let counterPrefix = "";
  if (trimmed.toLowerCase().startsWith("counter for ")) {
    counterPrefix = "counter for ";
  } else if (trimmed.toLowerCase().startsWith("counter of ")) {
    counterPrefix = "counter of ";
  }

  return {
    tildePrefix,
    tildeSuffix,
    dotsPrefix,
    dotsSuffix,
    counterPrefix,
    isVerb: trimmed.toLowerCase().startsWith("to "),
  };
};

const buildSmartMeaningChoices = (
  answer: string,
  localPool: string[],
  globalPool: string[]
): string[] => {
  const aff = extractMeaningAffixes(answer);
  const choices = new Set<string>([answer]);

  const applyTemplate = (cand: string): string | null => {
    let clean = cand
      .trim()
      .replace(/^[~～〜\s\.]+/, "")
      .replace(/[~～〜\s\.]+$/, "")
      .replace(/^counter (for|of)\s+/i, "");

    if (aff.isVerb && !clean.toLowerCase().startsWith("to ")) {
      clean = `to ${clean}`;
    } else if (!aff.isVerb && clean.toLowerCase().startsWith("to ")) {
      clean = clean.slice(3);
    }

    if (!clean) return null;

    let res = clean;
    if (aff.counterPrefix) res = `${aff.counterPrefix}${res}`;
    if (aff.dotsPrefix) res = `${aff.dotsPrefix}${res}`;
    if (aff.dotsSuffix) res = `${res}${aff.dotsSuffix}`;
    if (aff.tildePrefix) res = `${aff.tildePrefix}${res}`;
    if (aff.tildeSuffix) res = `${res}${aff.tildeSuffix}`;

    return res;
  };

  const pool = Array.from(new Set([...localPool, ...globalPool].filter(Boolean)));

  // Try natural matches first
  const naturalMatches = pool.filter((cand) => {
    if (cand.toLowerCase() === answer.toLowerCase()) return false;
    const candAff = extractMeaningAffixes(cand);
    if (aff.tildePrefix && !candAff.tildePrefix) return false;
    if (aff.tildeSuffix && !candAff.tildeSuffix) return false;
    if (aff.dotsPrefix && !candAff.dotsPrefix) return false;
    if (aff.dotsSuffix && !candAff.dotsSuffix) return false;
    if (aff.counterPrefix && !candAff.counterPrefix) return false;
    if (aff.isVerb !== candAff.isVerb) return false;
    return true;
  });

  for (const match of shuffle(naturalMatches)) {
    choices.add(match);
    if (choices.size >= 4) break;
  }

  // Format pool items if needed
  if (choices.size < 4) {
    for (const cand of shuffle(pool)) {
      if (cand.toLowerCase() === answer.toLowerCase()) continue;
      const formatted = applyTemplate(cand);
      if (formatted && formatted.toLowerCase() !== answer.toLowerCase() && !choices.has(formatted)) {
        choices.add(formatted);
        if (choices.size >= 4) break;
      }
    }
  }

  return shuffle(Array.from(choices));
};

const buildQuestions = (items: QuizItemSource[], settings: QuizSettings, quizVersion = 0): QuizQuestion[] => {
  const shuffledItems = shuffle(items);
  const questions: QuizQuestion[] = [];

  // Local distractor pools from current session/quiz items
  const localMeaningsPool = items.flatMap((entry) => entry.meanings ?? []);
  const localReadingsPool = items.flatMap((entry) => [...(entry.onyomi ?? []), ...(entry.kunyomi ?? [])]);
  const localVocabReadingPool = items.flatMap((entry) => entry.example_words ?? []).map((w) => w.reading);
  const localVocabMeaningPool = items.flatMap((entry) => entry.example_words ?? []).map((w) => w.meaning);

  const wantKanji = settings.contentMode === "kanji" || settings.contentMode === "mixed";
  const wantVocab = settings.contentMode === "vocabulary" || settings.contentMode === "mixed";
  const wantMeaning = settings.promptMode === "meaning" || settings.promptMode === "mixed";
  const wantReading = settings.promptMode === "reading" || settings.promptMode === "mixed";

  for (let index = 0; index < shuffledItems.length; index += 1) {
    const item = shuffledItems[(index + (quizVersion % Math.max(1, shuffledItems.length))) % shuffledItems.length];

    // --- Kanji-level questions ---
    if (wantKanji) {
      // Kanji meaning question
      if (wantMeaning && item.meanings?.length) {
        const answer = item.meanings[0];
        questions.push({
          id: `${item.character}-${index}-kanji-meaning`,
          prompt: "What does this kanji mean?",
          question: item.character,
          options: buildSmartMeaningChoices(answer, localMeaningsPool, GLOBAL_MEANINGS_POOL),
          answer,
          explanation: `${item.character} commonly means ${answer}.`,
          type: "kanji",
          kind: "meaning",
        });
      }

      // Kanji reading questions — one per onyomi and kunyomi
      if (wantReading) {
        const allReadings = [...(item.onyomi ?? []), ...(item.kunyomi ?? [])];
        if (allReadings.length > 0) {
          for (let ri = 0; ri < allReadings.length; ri++) {
            const reading = allReadings[ri];
            const isOn = ri < (item.onyomi?.length ?? 0);
            questions.push({
              id: `${item.character}-${index}-kanji-reading-${ri}`,
              prompt: isOn ? "What is the on'yomi of this kanji?" : "What is the kun'yomi of this kanji?",
              question: item.character,
              options: buildSmartReadingChoices(reading, localReadingsPool, GLOBAL_READINGS_POOL),
              answer: reading,
              explanation: `${item.character} can be read as ${reading} (${isOn ? "on'yomi" : "kun'yomi"}).`,
              type: "kanji",
              kind: "reading",
            });
          }
        } else if (item.meanings?.length) {
          // Fallback if no readings
          const answer = item.meanings[0];
          questions.push({
            id: `${item.character}-${index}-kanji-reading-fallback`,
            prompt: "How do you read this kanji?",
            question: item.character,
            options: buildSmartReadingChoices(answer, localReadingsPool, GLOBAL_READINGS_POOL),
            answer,
            explanation: `${item.character} — ${answer}.`,
            type: "kanji",
            kind: "reading",
          });
        }
      }
    }

    // --- Vocabulary questions — one per example word ---
    if (wantVocab) {
      const words = item.example_words ?? [];
      for (let wi = 0; wi < words.length; wi++) {
        const vocab = words[wi];

        if (wantMeaning) {
          questions.push({
            id: `${item.character}-${index}-vocab-meaning-${wi}`,
            prompt: "What does this vocabulary word mean?",
            question: vocab.word,
            options: buildSmartMeaningChoices(vocab.meaning, localVocabMeaningPool, GLOBAL_VOCAB_MEANING_POOL),
            answer: vocab.meaning,
            explanation: `${vocab.word} (${vocab.reading}) means ${vocab.meaning}.`,
            type: "vocabulary",
            kind: "meaning",
          });
        }

        if (wantReading) {
          questions.push({
            id: `${item.character}-${index}-vocab-reading-${wi}`,
            prompt: "How do you read this vocabulary word?",
            question: vocab.word,
            options: buildSmartReadingChoices(vocab.reading, localVocabReadingPool, GLOBAL_VOCAB_READING_POOL, vocab.word),
            answer: vocab.reading,
            explanation: `${vocab.word} (${vocab.meaning}) is read as ${vocab.reading}.`,
            type: "vocabulary",
            kind: "reading",
          });
        }
      }
    }
  }

  const allShuffled = shuffle(questions);
  if (settings.questionCount === "all") return allShuffled;
  return allShuffled.slice(0, Math.min(Number(settings.questionCount), allShuffled.length));
};

const Quiz = ({ title, subtitle, items, onBack }: QuizProps) => {
  const [settings, setSettings] = useState<QuizSettings>({
    contentMode: "mixed",
    promptMode: "mixed",
    questionCount: "10",
  });
  const [isStarted, setIsStarted] = useState(false);
  const [quizVersion, setQuizVersion] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [filterMode, setFilterMode] = useState<"all" | "incorrect" | "correct">("all");
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  const toggleQuestionExpanded = (id: string) => {
    setExpandedQuestionIds((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  };

  const questions = useMemo(() => buildQuestions(items, settings, quizVersion), [items, settings, quizVersion]);
  const currentQuestion = questions[selectedIndex];

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return ((selectedIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100;
  }, [questions.length, selectedIndex, selectedAnswer]);

  const filteredQuestions = useMemo(() => {
    return questions
      .map((q, index) => ({ q, originalIndex: index }))
      .filter(({ q, originalIndex }) => {
        const userAnswer = userAnswers[originalIndex];
        const isCorrect = userAnswer === q.answer;
        if (filterMode === "correct") return isCorrect;
        if (filterMode === "incorrect") return !isCorrect;
        return true;
      });
  }, [questions, userAnswers, filterMode]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer || !currentQuestion) return;
    setSelectedAnswer(option);
    setUserAnswers((previousAnswers) => ({ ...previousAnswers, [selectedIndex]: option }));
    if (option === currentQuestion.answer) {
      setScore((previousScore) => previousScore + 1);
    }
  };

  const handleStartQuiz = () => {
    setIsStarted(true);
    setIsFinished(false);
    setSelectedIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setUserAnswers({});
    setFilterMode("all");
    setIsReviewExpanded(false);
    setExpandedQuestionIds({});
    setQuizVersion((previousVersion) => previousVersion + 1);
  };

  const goToNext = () => {
    if (!currentQuestion || !selectedAnswer) return;

    if (selectedIndex === questions.length - 1) {
      setIsFinished(true);
      return;
    }

    setSelectedIndex((previousIndex) => previousIndex + 1);
    setSelectedAnswer(null);
  };

  const handleTryAgain = () => {
    setIsStarted(true);
    setIsFinished(false);
    setSelectedIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setUserAnswers({});
    setFilterMode("all");
    setIsReviewExpanded(false);
    setExpandedQuestionIds({});
    setQuizVersion((previousVersion) => previousVersion + 1);
  };

  const handleBack = () => {
    onBack?.();
  };

  const correctCount = score;
  const missedCount = questions.length - score;
  const percentage = questions.length ? Math.round((score / questions.length) * 100) : 0;

  if (!isStarted) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-[18px] font-semibold uppercase tracking-[0.2em] text-[#464c91]">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{subtitle}</h3>
          <p className="mt-2 text-[17px] text-slate-600">Choose how you want to practice before you begin.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[18px] font-semibold uppercase tracking-[0.2em] text-[#464c91]">Content</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                { value: "kanji", label: "Kanji only" },
                { value: "vocabulary", label: "Words only" },
                { value: "mixed", label: "Both" },
              ] as Array<{ value: ContentMode; label: string }>).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings((previousSettings) => ({ ...previousSettings, contentMode: option.value }))}
                  className={`rounded-full px-3 py-1.5 text-[16px] font-medium transition ${settings.contentMode === option.value ? "bg-[#464c91] text-white" : "bg-white text-black hover:bg-gray-200"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[18px] font-semibold uppercase tracking-[0.2em] text-[#464c91] ">Focus</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                { value: "meaning", label: "Meaning" },
                { value: "reading", label: "Reading" },
                { value: "mixed", label: "Both" },
              ] as Array<{ value: PromptMode; label: string }>).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings((previousSettings) => ({ ...previousSettings, promptMode: option.value }))}
                  className={`rounded-full px-3 py-1.5 text-[16px] font-medium transition ${settings.promptMode === option.value ? "bg-[#464c91] text-white" : "bg-white text-black hover:bg-gray-200"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[18px] font-semibold uppercase tracking-[0.2em] text-[#464c91]">Questions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                { value: "10", label: "10" },
                { value: "20", label: "20" },
                { value: "all", label: "All" },
              ] as Array<{ value: QuizCount; label: string }>).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSettings((previousSettings) => ({ ...previousSettings, questionCount: option.value }))}
                  className={`rounded-full px-3 py-1.5 text-[16px] font-medium transition ${settings.questionCount === option.value ? "bg-[#464c91] text-white" : "bg-white text-black hover:bg-gray-200"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[16px] text-slate-500">
            {items.length} kanji · {settings.questionCount === "all" ? "all" : settings.questionCount} questions
          </p>
          <button
            onClick={handleStartQuiz}
            className="rounded-full bg-[#464c91] px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-[#34396f]"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#464c91]">Quiz</p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">No questions available yet.</h3>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#464c91]">Quiz complete</p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-900">Results</h3>
        <p className="mt-2 text-[15px] text-slate-600">You finished this quiz set. Here is how you did.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Accuracy</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-800">{percentage}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Correct</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{correctCount}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-700">Missed</p>
            <p className="mt-2 text-3xl font-semibold text-rose-800">{missedCount}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleTryAgain}
            className="rounded-full bg-[#464c91] px-5 py-2.5 text-lg font-semibold text-white transition hover:bg-[#34396f]"
          >
            Try again
          </button>
          <button
            onClick={handleBack}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#464c91] hover:text-[#464c91]"
          >
            Back to Quiz Sets
          </button>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header Card matching StudyPlans level card */}
            <button
              type="button"
              onClick={() => setIsReviewExpanded((prev) => !prev)}
              className="w-full bg-slate-50 p-5 text-left transition hover:bg-slate-100/80 cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#464c91]/10 text-[#464c91] shrink-0">
                    {isReviewExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-[#464c91] text-white">
                        REVIEW
                      </span>
                      <span className="text-[14px] font-semibold text-[#464c91]">
                        Quiz Review
                      </span>
                    </div>
                    <h3 className="mt-1 text-xl font-semibold text-slate-900">
                      Review Questions & Answers
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-left sm:text-right ml-11 sm:ml-0">
                  <span className="text-sm font-medium text-slate-600">
                    {questions.length} questions · {percentage}% accuracy
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700">
                    {isReviewExpanded ? "Hide" : "Show"}
                  </span>
                </div>
              </div>
            </button>

            {/* Content visible when level/review card is expanded */}
            {isReviewExpanded && (
              <div className="p-4 sm:p-5 bg-slate-50/50 space-y-4 border-t border-slate-200">
                {/* Filter pills */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Filter Questions:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterMode("all")}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        filterMode === "all"
                          ? "bg-[#464c91] text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      All ({questions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("incorrect")}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        filterMode === "incorrect"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      Incorrect ({missedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode("correct")}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        filterMode === "correct"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      Correct ({correctCount})
                    </button>
                  </div>
                </div>

                {/* Question items styled like StudyPlans session cards */}
                <div className="space-y-3">
                  {filteredQuestions.map(({ q, originalIndex }) => {
                    const userAnswer = userAnswers[originalIndex];
                    const isUserCorrect = userAnswer === q.answer;
                    const isQuestionExpanded = Boolean(expandedQuestionIds[q.id]);

                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border bg-white transition-all shadow-xs ${
                          isUserCorrect
                            ? "border-emerald-200"
                            : "border-rose-200"
                        }`}
                      >
                        {/* Question Card Header */}
                        <button
                          type="button"
                          onClick={() => toggleQuestionExpanded(q.id)}
                          className="w-full flex items-center justify-between p-4 text-left cursor-pointer select-none rounded-xl hover:bg-slate-50/80 transition"
                        >
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                              #{originalIndex + 1}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              {q.type === "kanji" ? "Kanji" : "Vocabulary"}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                              {q.kind === "meaning" ? "Meaning" : "Reading"}
                            </span>
                            <span className="font-bold text-slate-900 text-lg sm:text-xl ml-1" style={{ fontFamily: "var(--font-display)" }}>
                              {q.question}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-semibold ${
                                isUserCorrect
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {isUserCorrect ? "✓ Correct" : "✕ Incorrect"}
                            </span>
                            <ChevronDown
                              className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                                isQuestionExpanded ? "rotate-180 text-[#464c91]" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Question Card Body */}
                        {isQuestionExpanded && (
                          <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/30">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-[#464c91]">{q.prompt}</p>
                              <p className="mt-1 text-3xl font-semibold text-slate-900">{q.question}</p>
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              {q.options.map((option) => {
                                const isSelected = userAnswer === option;
                                const isCorrectOption = option === q.answer;

                                let optionBoxClass = "border-slate-200 bg-white text-slate-700";
                                if (isCorrectOption) {
                                  optionBoxClass = "border-emerald-400 bg-emerald-50 text-emerald-800 font-medium";
                                } else if (isSelected && !isCorrectOption) {
                                  optionBoxClass = "border-rose-400 bg-rose-50 text-rose-800 font-medium line-through";
                                }

                                return (
                                  <div
                                    key={option}
                                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm ${optionBoxClass}`}
                                  >
                                    <span>{option}</span>
                                    {isSelected && isCorrectOption && (
                                      <span className="rounded-md bg-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                        Your Answer ✓
                                      </span>
                                    )}
                                    {isSelected && !isCorrectOption && (
                                      <span className="rounded-md bg-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-800">
                                        Your Choice ✕
                                      </span>
                                    )}
                                    {!isSelected && isCorrectOption && (
                                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                        Correct Answer
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">Explanation: </span>
                              {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredQuestions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                      No questions found for this filter mode.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isAnswered = Boolean(selectedAnswer);
  const isCorrect = selectedAnswer === currentQuestion.answer;
  const isLastQuestion = selectedIndex === questions.length - 1;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-lg font-semibold uppercase tracking-[0.2em] text-[#464c91]">{title}</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900">{subtitle}</h3>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#464c91] transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mb-6 flex items-center justify-between text-sm text-slate-600">
        <span>
          Question {selectedIndex + 1} / {questions.length}
        </span>
        <span>
          Score {score} / {questions.length}
        </span>
      </div>
      <div className="flex justify-center items-center">
        <div className="rounded-2xl max-w-sm w-full bg-gray-100 p-5 text-center">
          <div className="bg-white rounded-2xl px-3 py-5 shadow-md ">
            <p className="text-xs mb-2 uppercase tracking-[0.1em] text-[#464c91]">{currentQuestion.prompt}</p>
            <h4 className="mt-6 text-7xl font-semibold text-slate-900">{currentQuestion.question}</h4>
          </div>
          

          <div className="mt-6 grid gap-3">
            {currentQuestion.options.map((option) => {
              const isChosen = selectedAnswer === option;
              const isRight = option === currentQuestion.answer;
              let optionClasses = "w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 transition";

              if (isAnswered) {
                if (isRight) {
                  optionClasses = "w-full rounded-2xl border px-4 py-3 text-center text-sm font-medium transition border-emerald-500 bg-emerald-50 text-emerald-700";
                } else if (isChosen) {
                  optionClasses = "w-full rounded-2xl border px-4 py-3 text-center text-sm font-medium transition border-rose-500 bg-rose-50 text-rose-700";
                }
              } else {
                optionClasses += " hover:border-[#464c91] hover:bg-slate-100";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                  className={optionClasses}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className={`font-semibold text-[15px] ${isCorrect ? "text-emerald-600" : "text-rose-600"}`}>
                {isCorrect ? "Correct!" : `Not quite — the correct answer is ${currentQuestion.answer}.`}
              </p>
              <p className="mt-2 text-[15px] text-slate-600">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      </div>
      

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {isAnswered ? (isLastQuestion ? "You reached the end of this quiz." : "Tap below to continue.") : "Pick the best answer."}
        </p>
        <button
          onClick={goToNext}
          disabled={!isAnswered}
          className="rounded-full bg-[#464c91] px-4 py-2 text-lg font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 hover:bg-[#34396f]"
        >
          {isLastQuestion ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default Quiz;
