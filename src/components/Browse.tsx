import { ALL_KANJI } from '../lib/kanjiData';
import KanjiCard from './KanjiCard';

const Browse = () => {
  return (
    <div>
      <KanjiCard items={ALL_KANJI} />
    </div>
  )
}

export default Browse
