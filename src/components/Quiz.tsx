import { useMemo, useState } from "react";

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

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

const buildChoices = (answer: string, pool: string[]) => {
  const uniquePool = Array.from(new Set(pool.filter(Boolean)));
  const distractors = uniquePool.filter((value) => value.toLowerCase() !== answer.toLowerCase());
  const options = [answer, ...shuffle(distractors).slice(0, 3)];
  return shuffle(options);
};

const buildQuestions = (items: QuizItemSource[], settings: QuizSettings, quizVersion = 0): QuizQuestion[] => {
  const shuffledItems = shuffle(items);
  const questions: QuizQuestion[] = [];

  // Build distractor pools from ALL items (not just selected) for better variety
  const allMeaningsPool = items.flatMap((entry) => entry.meanings ?? []);
  const allReadingsPool = items.flatMap((entry) => [...(entry.onyomi ?? []), ...(entry.kunyomi ?? [])]);
  const allVocabReadingPool = items.flatMap((entry) => entry.example_words ?? []).map((w) => w.reading);
  const allVocabMeaningPool = items.flatMap((entry) => entry.example_words ?? []).map((w) => w.meaning);

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
          options: buildChoices(answer, allMeaningsPool),
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
              options: buildChoices(reading, allReadingsPool),
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
            options: buildChoices(answer, allReadingsPool),
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
            options: buildChoices(vocab.meaning, allVocabMeaningPool),
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
            options: buildChoices(vocab.reading, allVocabReadingPool),
            answer: vocab.reading,
            explanation: `${vocab.word} is read as ${vocab.reading}.`,
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

  const questions = useMemo(() => buildQuestions(items, settings, quizVersion), [items, settings, quizVersion]);
  const currentQuestion = questions[selectedIndex];

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return ((selectedIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100;
  }, [questions.length, selectedIndex, selectedAnswer]);

  const handleAnswer = (option: string) => {
    if (selectedAnswer || !currentQuestion) return;
    setSelectedAnswer(option);
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
