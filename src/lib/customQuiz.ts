import { ALL_KANJI } from "./kanjiData";

export const CUSTOM_QUIZ_SELECTION_KEY = "custom-quiz-selection";
export const CUSTOM_QUIZ_SETS_STORAGE_KEY = "custom-quiz-sets";

export type QuizKanji = (typeof ALL_KANJI)[number];

export type CustomQuizSet = {
  id: string;
  title: string;
  characters: string[];
};

const buildId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getSelectedQuizCharacters(): string[] {
  return loadFromStorage<string[]>(CUSTOM_QUIZ_SELECTION_KEY, []);
}

export function saveSelectedQuizCharacters(characters: string[]) {
  saveToStorage(CUSTOM_QUIZ_SELECTION_KEY, characters);
}

export function toggleSelectedQuizCharacter(character: string) {
  const currentCharacters = getSelectedQuizCharacters();
  const nextCharacters = currentCharacters.includes(character)
    ? currentCharacters.filter((entry) => entry !== character)
    : [...currentCharacters, character];

  saveSelectedQuizCharacters(nextCharacters);
  return nextCharacters;
}

export function clearSelectedQuizCharacters() {
  saveToStorage(CUSTOM_QUIZ_SELECTION_KEY, []);
}

export function getSelectedQuizItems(): QuizKanji[] {
  const characters = getSelectedQuizCharacters();
  return characters
    .map((character) => ALL_KANJI.find((item) => item.character === character))
    .filter((item): item is QuizKanji => Boolean(item));
}

export function getCustomQuizSets(): CustomQuizSet[] {
  return loadFromStorage<CustomQuizSet[]>(CUSTOM_QUIZ_SETS_STORAGE_KEY, []);
}

export function saveCustomQuizSets(sets: CustomQuizSet[]) {
  saveToStorage(CUSTOM_QUIZ_SETS_STORAGE_KEY, sets);
}

export function addCustomQuizSet(title: string, items: QuizKanji[]) {
  const nextSet: CustomQuizSet = {
    id: buildId(),
    title,
    characters: items.map((item) => item.character),
  };

  const nextSets = [nextSet, ...getCustomQuizSets()];
  saveCustomQuizSets(nextSets);
  return nextSets;
}

export function deleteCustomQuizSet(id: string) {
  const nextSets = getCustomQuizSets().filter((set) => set.id !== id);
  saveCustomQuizSets(nextSets);
  return nextSets;
}

export function getCustomQuizSetItems(set: CustomQuizSet) {
  return set.characters
    .map((character) => ALL_KANJI.find((item) => item.character === character))
    .filter((item): item is QuizKanji => Boolean(item));
}
