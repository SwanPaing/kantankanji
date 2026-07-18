import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import KanjiCard from "../components/KanjiCard";
import KanjiDetailModal from "../components/KanjiDetailModal";
import { ALL_KANJI, GRADES, JLPT_LEVELS } from "../lib/kanjiData";
import {
  clearSelectedQuizCharacters,
  getSelectedQuizCharacters,
  toggleSelectedQuizCharacter,
} from "../lib/customQuiz";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

type Kanji = typeof ALL_KANJI[number];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedForQuiz, setSelectedForQuiz] = useState<string[]>(() => getSelectedQuizCharacters());
  const navigate = useNavigate();

  const filteredKanji = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase().replace(/[\s\-_.,/()]/g, "");

    return ALL_KANJI.filter((item) => {
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(item.jlpt_level ?? "None");
      const matchesGrade = selectedGrades.length === 0 || selectedGrades.includes(item.grade ?? "None");

      if (!normalizedQuery) {
        return matchesLevel && matchesGrade;
      }

      const searchableFields = [
        item.character,
        ...(item.meanings ?? []),
        ...(item.onyomi ?? []),
        ...(item.kunyomi ?? []),
      ];

      const searchableText = searchableFields
        .map((value) => value.toLowerCase().replace(/[\s\-_.,/()]/g, ""))
        .join(" ");

      return matchesLevel && matchesGrade && searchableText.includes(normalizedQuery);
    });
  }, [searchTerm, selectedGrades, selectedLevels]);

  const toggleSelection = (value: string, currentValues: string[], updateValues: (nextValues: string[]) => void) => {
    if (currentValues.includes(value)) {
      updateValues(currentValues.filter((entry) => entry !== value));
      return;
    }

    updateValues([...currentValues, value]);
  };

  const hasActiveFilters = selectedLevels.length > 0 || selectedGrades.length > 0;
  const hasCustomSelection = selectedForQuiz.length > 0;
  const [showSelectedKanji, setShowSelectedKanji] = useState(false);

  const handleToggleCustomSelection = (item: Kanji) => {
    const nextCharacters = toggleSelectedQuizCharacter(item.character);
    setSelectedForQuiz(nextCharacters);
  };

  const handleClearSelection = () => {
    clearSelectedQuizCharacters();
    setSelectedForQuiz([]);
    setShowSelectedKanji(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <h1 className="text-4xl font-bold text-black m-2 mt-8 mb-2">簡単な漢字</h1>
      <p className="text-[#464c91] text-xl m-2 mb-6">Kanji Learning App with Quizzes</p>
      <div className="m-2 mb-6">
        <h1 className="mb-4 text-4xl font-bold text-black">Browse Kanji</h1>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-2.5 top-[38%] -translate-y-1/2 text-[#464c91]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by meaning, onyomi, or kunyomi"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-9 text-black shadow-sm outline-none focus:border-[#464c91] focus:ring-1 focus:ring-[#464c91]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((current) => !current)}
              className="flex items-center gap-2 rounded-lg border border-[#464c91] bg-white px-4 py-2 text-sm font-medium text-[#464c91] shadow-sm transition hover:bg-[#f2f3ff]"
            >
              <FontAwesomeIcon icon={faFilter} />
              <span>Filter</span>
              {hasActiveFilters ? <span className="rounded-full bg-[#464c91] px-2 py-0.5 text-xs text-white">{selectedLevels.length + selectedGrades.length}</span> : null}
            </button>

            {isFilterOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                <div className="mb-4">
                  <h2 className="mb-2 text-sm font-semibold text-gray-700">JLPT Levels</h2>
                  <div className="flex flex-wrap gap-2">
                    {JLPT_LEVELS.map((level) => {
                      const isSelected = selectedLevels.includes(level);
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleSelection(level, selectedLevels, setSelectedLevels)}
                          className={`rounded-full px-3 py-1 text-sm ${isSelected ? "bg-[#464c91] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <h2 className="mb-2 text-sm font-semibold text-gray-700">School Grades</h2>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((grade) => {
                      const isSelected = selectedGrades.includes(grade);
                      return (
                        <button
                          key={grade}
                          type="button"
                          onClick={() => toggleSelection(grade, selectedGrades, setSelectedGrades)}
                          className={`rounded-full px-3 py-1 text-sm ${isSelected ? "bg-[#464c91] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLevels([]);
                      setSelectedGrades([]);
                    }}
                    className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-md bg-[#464c91] px-3 py-1.5 text-sm text-white hover:bg-[#3c437d]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-[#464c91]/20 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[16px] text-slate-600">Select kanjis to build your custom quiz set.</p>
            </div>    
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            
          
          </div>
          <KanjiCard
            items={filteredKanji}
            onCardClick={(kanji) => setSelectedKanji(kanji)}
            selectedCharacters={selectedForQuiz}
            onSelectionToggle={handleToggleCustomSelection}
            showSelectionButton
          />
        </div>

        {hasCustomSelection ? (
          <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-2xl bg-[#333333] p-4 shadow-lg sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#d1d5db]">Selected: {selectedForQuiz.length}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSelectedKanji((value) => !value)}
                  className="rounded-md border border-[#464c91] bg-transparent px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#464c91]/20"
                >
                  {showSelectedKanji ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="rounded-md px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#464c91]/20"
                >
                  Clear selection
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/quizSets")}
                  className="rounded-full bg-[#464c91] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3c437d]"
                >
                  Create a quiz set
                </button>
              </div>
            </div>
            {showSelectedKanji ? (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[#464c91]/30 pt-3 text-white">
                {selectedForQuiz.map((character) => (
                  <span key={character} className="rounded-full border border-[#464c91] bg-[#464c91]/20 px-3 py-1 text-sm font-medium">
                    {character}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        
        
      </div>

      {selectedKanji ? (
        <KanjiDetailModal
          kanji={selectedKanji}
          selected={false}
          onSelect={() => {}}
          onClose={() => setSelectedKanji(null)}
        />
      ) : null}
    </div>
  );
}