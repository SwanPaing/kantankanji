import { ALL_KANJI } from "../lib/kanjiData";

type KanjiCardItem = typeof ALL_KANJI[number];

type KanjiCardProps = {
  items: KanjiCardItem[];
  onCardClick?: (kanji: KanjiCardItem) => void;
  selectedCharacters?: string[];
  onSelectionToggle?: (kanji: KanjiCardItem) => void;
};

const KanjiCard = ({ items, onCardClick, selectedCharacters = [], onSelectionToggle }: KanjiCardProps) => {
  const levelColors: Record<string, string> = {
    N5: 'bg-green-100 text-green-800',
    N4: 'bg-blue-100 text-blue-800',
    N3: 'bg-yellow-100 text-yellow-800',
    N2: 'bg-orange-100 text-orange-800',
    N1: 'bg-red-100 text-red-800',
    None: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-2 sm:gap-4 p-2 sm:p-4 text-black">
      {items.map((item, index) => {
        const isSelected = selectedCharacters.includes(item.character);

        return (
          <div key={item.character || index} className="relative">
            <button
              type="button"
              onClick={() => onCardClick?.(item)}
              className={`block w-30 h-30 rounded-lg border p-2 text-center transition-shadow duration-200 hover:shadow-lg ${isSelected ? "border-[#464c91] ring-2 ring-[#464c91]/20 bg-[#f7f8ff]" : "border-gray-300 bg-white"}`}
            >
              <div>
                <h3 className="text-3xl font-bold m-2">{item.character}</h3>
                <p className="text-[14px]">
                  <span className={`px-2 ${levelColors[item.jlpt_level ?? 'None'] || levelColors.None}`}>{item.jlpt_level ?? 'None'}</span>
                </p>
                <p className="text-[15px]">{(item.meanings || []).slice(0, 1).join(', ')}</p>
              </div>
            </button>

            
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectionToggle?.(item);
                }}
                className={`absolute right-3 top-1 w-6 h-6 rounded-full px-2 py-1 text-[11px] border border-slate-300 font-semibold shadow-sm ${isSelected ? "bg-[#464c91] text-white" : "bg-white text-[#464c91] shadow-sm"}`}
              >
                {isSelected ? "✓" : " "}
              </button>
            
          </div>
        );
      })}
    </div>
  )
}

export default KanjiCard
