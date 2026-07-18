import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

type KanjiData = {
  character: string;
  jlpt_level?: string | null;
  grade?: string | null;
  meanings?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  stroke_count?: number;
  example_words?: Array<{ word: string; reading: string; meaning: string }>;
};

type KanjiDetailModalProps = {
  kanji: KanjiData;
  selected: boolean;
  onSelect: () => void;
  onClose: () => void;
};



export default function KanjiDetailModal({ kanji, onClose }: KanjiDetailModalProps) {
  const [vocab] = useState(kanji.example_words || []);

  const levelColors: Record<string, string> = {
    N5: 'bg-green-100 text-green-800',
    N4: 'bg-blue-100 text-blue-800',
    N3: 'bg-yellow-100 text-yellow-800',
    N2: 'bg-orange-100 text-orange-800',
    N1: 'bg-red-100 text-red-800',
    None: 'bg-gray-100 text-gray-600',
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white text-black px-6 py-2 shadow-2xl overflow-hidden">
        
        <div className="flex items-center justify-between py-1 border-b border-gray-300">
          <div className="flex items-center gap-3 text-[16px] font-bold">
            {kanji.jlpt_level && kanji.jlpt_level !== 'None' && (
              <span className={` px-2 py-0.5 rounded-full ${levelColors[kanji.jlpt_level] ?? levelColors.None}`}>
                {kanji.jlpt_level}
              </span>
            )}
            {kanji.grade && kanji.grade !== 'None' && (
              <span className="font-medium text-[15px] ">Grade {kanji.grade}</span>
            )}
          </div>
          <button onClick={onClose} className=" hover: p-1 rounded-lg hover:bg-secondary transition-colors">
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4 text-black" />
          </button>
        </div>
        
        <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
            <div className="flex gap-10 ">
              <div className="flex flex-col items-center gap-3 flex-shrink-0">
                <span
                  className=" text-8xl font-black leading-none"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {kanji.character}
                </span>
                <span className="text-[16px]">{kanji.stroke_count} strokes</span>
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <p className="text-[13px] text-[#464c91] font-bold  uppercase tracking-widest mb-2">Meaning</p>
                  <p className="text-[18px] ">{(kanji.meanings || []).join(', ') || '—'}</p>
                </div>
                {kanji.onyomi && kanji.onyomi.length > 0 && (
                  <div>
                    <p className="text-[13px] text-[#464c91] font-bold  uppercase tracking-widest mb-2">On'yomi</p>
                    <div className="flex flex-wrap gap-1">
                      {(kanji.onyomi ?? []).map((r: string) => (
                        <span key={r} className="px-2 py-0.5 rounded-full bg-gray-300 text-blue-700 text-[15px] font-semibold">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {kanji.kunyomi && kanji.kunyomi.length > 0 && (
                  <div>
                    <p className="text-[13px] text-[#464c91] font-bold  uppercase tracking-widest mb-2">Kun'yomi</p>
                    <div className="flex flex-wrap gap-1">
                      {(kanji.kunyomi ?? []).map((r: string) => (
                        <span key={r} className="px-1 py-0.5 rounded-full bg-gray-300 text-green-600 text-[15px] font-semibold">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[14px] text-[#464c91] font-bold  uppercase tracking-widest">Vocabularies</p>
                  <span className="text-[13px] ">( {vocab.length} words )</span>
                </div>
                {vocab.length > 0 ? (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {vocab.map((ex: { word: string; reading: string; meaning: string }, i: number) => (
                      <div key={`${ex.word}-${i}`} className="flex items-baseline gap-5 rounded-xl px-2 py-1 bg-[#e9f3ff]">
                        <span className="font-bold text-[20px] shrink-0" style={{ fontFamily: 'var(--font-display)' }}>{ex.word}</span>
                        <span className="text-[15px] shrink-0">{ex.reading}</span>
                        <span className="text-[15px]  ml-auto text-right">{ex.meaning}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
            </div>
        </div>
        {/* <div className="flex items-start justify-between gap-4 my-5">
          <h2 className=" text-7xl font-black">{kanji.character}</h2>
          <div className="mr-20 border border-red-500">
            {kanji.meanings?.length ? (
              <div>
                <p className="text-xs uppercase text-left text-gray-500 mx-0 mb-1">Meanings</p>
                <p className="text-[18px] ">{(kanji.meanings || []).join(', ') || '—'}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ">
            {kanji.onyomi?.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest mb-2">Onyomi</p>
                <p>{kanji.onyomi.join(', ')}</p>
              </div>
            ) : null}
            {kanji.kunyomi?.length ? (
              <div>
                <p className="text-xs uppercase tracking-widest mb-2">Kunyomi</p>
                <p>{kanji.kunyomi.join(', ')}</p>
              </div>
            ) : null}
            {kanji.stroke_count ? (
              <div>
                <p className="text-xs uppercase tracking-widest mb-2">Stroke Count</p>
                <p>{kanji.stroke_count}</p>
              </div>
            ) : null}
          </div>

          <button onClick={onSelect} className={`w-full rounded-xl py-3 text-sm font-semibold ${selected ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'}`}>
            {selected ? 'Remove from selection' : 'Select for quiz'}
          </button>
        </div> */}
      </div>
    </div>
  );
}
