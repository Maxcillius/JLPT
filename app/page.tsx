'use client'

import React, { useState, useMemo, ChangeEvent, MouseEvent, FormEvent, useRef } from 'react';

// --- Types ---
type Category = 'Noun' | 'Verb' | 'I-Adjective' | 'Na-Adjective' | 'Adverb' | 'Other';

interface Word {
  id: string;
  hiragana: string;
  kanji?: string;
  definition: string;
  category?: Category;
}

// --- SVG Icons ---
const TrashIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

interface HamburgerIconProps {
  onClick: () => void;
}

const HamburgerIcon: React.FC<HamburgerIconProps> = ({ onClick }) => (
  <button onClick={onClick} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-4 6h4" />
    </svg>
  </button>
);

const SearchIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CloseIcon: React.FC<HamburgerIconProps> = ({ onClick }) => (
  <button onClick={onClick} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
);

// --- Trie Implementation for Search ---
class TrieNode {
  children: Map<string, TrieNode>;
  wordIds: Set<string>;

  constructor() {
    this.children = new Map();
    this.wordIds = new Set();
  }
}

class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(text: string, wordId: string) {
    let node = this.root;
    for (const char of text) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.wordIds.add(wordId);
    }
  }

  search(query: string): string[] {
    let node = this.root;
    for (const char of query) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }
    return Array.from(node.wordIds);
  }
}

// --- VocabCard Component ---
interface VocabCardProps {
  word: Word;
  onDelete: (id: string) => void;
}

const VocabCard: React.FC<VocabCardProps> = ({ word, onDelete }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const categoryColor: string = {
    'Noun': 'bg-blue-900 text-blue-200',
    'Verb': 'bg-green-900 text-green-200',
    'I-Adjective': 'bg-yellow-900 text-yellow-200',
    'Na-Adjective': 'bg-purple-900 text-purple-200',
    'Adverb': 'bg-pink-900 text-pink-200',
    'Other': 'bg-gray-600 text-gray-100',
  }[word.category ?? 'Other'];

  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowDelete(true);
    }, 500);
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePressEnd = () => {
    clearLongPressTimer();
  };
  
  const handleClick = () => {
    if (showDelete) {
      setShowDelete(false);
      return;
    }
    setIsRevealed(!isRevealed);
  };

  return (
    <div
      className="group rounded-lg [perspective:1000px] cursor-pointer relative"
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={clearLongPressTimer}
    >
      <div
        className={`relative min-h-[160px] w-full shadow-lg rounded-lg transition-transform duration-500 [transform-style:preserve-3d] ${isRevealed ? '[transform:rotateY(180deg)]' : ''}`}
      >
        {/* Front */}
        <div className="absolute inset-0 bg-gray-800 p-4 rounded-lg flex flex-col justify-center items-center text-center [backface-visibility:hidden]">
          <div>
            {word.kanji ? (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 break-all px-2">{word.kanji}</div>
                <div className="text-lg sm:text-xl text-gray-300 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-[1.5em]">
                  {word.hiragana}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 break-all px-2">{word.hiragana}</div>
                <div className="text-lg sm:text-xl h-[1.5em]"></div>
              </>
            )}
          </div>
          {word.category && (
            <span className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded ${categoryColor}`}>
              {word.category}
            </span>
          )}
        </div>

        {/* Back */}
        <div className="absolute inset-0 bg-gray-800 p-4 rounded-lg flex flex-col justify-center items-center text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-base sm:text-lg text-gray-100 break-all px-2">{word.definition}</p>
          {word.category && (
            <span className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-0.5 rounded ${categoryColor}`}>
              {word.category}
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onDelete(word.id);
        }}
        className={`absolute bottom-2 right-2 p-1.5 bg-black/50 rounded-full text-red-400 hover:text-red-300 transition-opacity duration-200 z-10 ${showDelete ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        title="Delete word"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

// --- SideMenu Component ---
interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: 'home' | 'add') => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate }) => {
  return (
    <>
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      <div className={`fixed top-0 left-0 w-64 h-full bg-gray-900 shadow-xl shadow-black/30 z-50 p-6 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h2 className="text-2xl font-bold text-white mb-8">Menu</h2>
        <nav className="flex flex-col gap-4">
          <button 
            onClick={() => onNavigate('home')} 
            className="text-lg text-gray-300 hover:text-amber-400 hover:bg-gray-800 text-left py-2 px-3 rounded-md transition-colors"
          >
            Home (Vocabulary)
          </button>
          <button 
            onClick={() => onNavigate('add')} 
            className="text-lg text-gray-300 hover:text-amber-400 hover:bg-gray-800 text-left py-2 px-3 rounded-md transition-colors"
          >
            Add New Word
          </button>
        </nav>
      </div>
    </>
  );
};

// --- HomePage Component ---
interface HomePageProps {
  vocabulary: Word[];
  onDelete: (id: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ vocabulary, onDelete }) => {
  const groupedVocabulary: Record<Category, Word[]> = useMemo(() => {
    return vocabulary.reduce((acc, word) => {
      const category: Category = word.category ?? 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(word);
      return acc;
    }, {} as Record<Category, Word[]>);
  }, [vocabulary]);

  const categoryOrder: Category[] = ['Noun', 'Verb', 'I-Adjective', 'Na-Adjective', 'Adverb', 'Other'];

  return (
    <section className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg flex flex-col w-full">
      {vocabulary.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-400 min-h-[200px]">
          { groupedVocabulary ? "No words found for your search." : "Add some words to get started!" }
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {categoryOrder.map(category =>
            groupedVocabulary[category] && groupedVocabulary[category].length > 0 && (
              <div key={category}>
                <h3 className="text-lg font-semibold text-amber-400 uppercase tracking-wider mb-4 pb-2 border-b border-gray-700">{category}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {groupedVocabulary[category].map(word => (
                    <VocabCard key={word.id} word={word} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
};

// --- AddWordPage Component ---
interface AddWordPageProps {
  onWordAdded: (word: Word) => void;
}

const categories: Category[] = ['Noun', 'Verb', 'I-Adjective', 'Na-Adjective', 'Adverb', 'Other'];

const AddWordPage: React.FC<AddWordPageProps> = ({ onWordAdded }) => {
  const [newHiragana, setNewHiragana] = useState('');
  const [newKanji, setNewKanji] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('Noun');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddNewWord = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newHiragana || !newDefinition) {
      setFormError("Hiragana and Definition are required.");
      return;
    }

    setFormError(null);

    const newWord: Word = {
      id: crypto.randomUUID(),
      hiragana: newHiragana,
      kanji: newKanji || undefined,
      definition: newDefinition,
      category: newCategory,
    };

    onWordAdded(newWord);
    setNewHiragana('');
    setNewKanji('');
    setNewDefinition('');
    setNewCategory('Noun');
  };

  return (
    <section className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-lg mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">Add New Word</h2>

      {formError && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <span className="block sm:inline">{formError}</span>
        </div>
      )}

      <form onSubmit={handleAddNewWord} className="flex flex-col gap-4">
        <div>
          <label htmlFor="hiragana" className="block text-sm font-medium text-gray-300 mb-1">Hiragana (Required)</label>
          <input
            type="text"
            id="hiragana"
            value={newHiragana}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewHiragana(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="たべる"
            required
          />
        </div>
        <div>
          <label htmlFor="kanji" className="block text-sm font-medium text-gray-300 mb-1">Kanji (Optional)</label>
          <input
            type="text"
            id="kanji"
            value={newKanji}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewKanji(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="食べる"
          />
        </div>
        <div>
          <label htmlFor="definition" className="block text-sm font-medium text-gray-300 mb-1">Definition (Required)</label>
          <input
            type="text"
            id="definition"
            value={newDefinition}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewDefinition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="To eat"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Category (Required)</label>
          <select
            id="category"
            value={newCategory}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewCategory(e.target.value as Category)}
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full mt-2 px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Add Word
        </button>
      </form>
    </section>
  );
};

// --- Main App Component ---
export default function App() {
  const [vocabulary, setVocabulary] = useState<Word[]>(() =>
    initialVocabulary.map(word => ({ ...word, id: crypto.randomUUID() }))
  );
  const [page, setPage] = useState<'home' | 'add'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchTrie = useMemo(() => {
    const trie = new Trie();
    vocabulary.forEach(word => {
      const textsToInsert = [word.hiragana, word.kanji, word.definition].filter(Boolean) as string[];
      textsToInsert.forEach(text => {
        const lowerText = text.toLowerCase();
        for (let i = 0; i < lowerText.length; i++) {
          trie.insert(lowerText.substring(i), word.id);
        }
      });
    });
    return trie;
  }, [vocabulary]);

  const filteredVocabulary = useMemo(() => {
    if (!searchQuery) {
      return vocabulary;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const wordIds = searchTrie.search(lowerQuery);
    const wordIdSet = new Set(wordIds);
    return vocabulary.filter(word => wordIdSet.has(word.id));
  }, [vocabulary, searchQuery, searchTrie]);


  const handleDeleteWord = (wordId: string) => {
    setVocabulary(prev => prev.filter(word => word.id !== wordId));
  };

  const handleAddWord = (newWord: Word) => {
    setVocabulary(prev => [...prev, newWord]);
    navigateTo('home');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigateTo = (pageName: 'home' | 'add') => {
    setPage(pageName);
    setIsMenuOpen(false);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gray-900 p-4 sm:p-8 font-inter">
      <SideMenu 
        isOpen={isMenuOpen}
        onClose={toggleMenu}
        onNavigate={navigateTo}
      />
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-6 pb-4 border-b border-gray-700">
          <div className="relative flex items-center justify-center max-w-5xl mx-auto h-12">
            
            {/* Left Icon */}
            <div className="absolute left-0">
              <HamburgerIcon onClick={toggleMenu} />
            </div>

            {/* Center Content: Title */}
            <div className="text-center truncate">
              <h1 className="text-2xl sm:text-4xl font-bold text-amber-300 truncate">日本語単語帳</h1>
              <p className="text-sm sm:text-lg text-amber-400">Japanese Vocabulary Learner</p>
            </div>
          </div>
        </header>

        {/* Search Section (Home Page Only) */}
        {page === 'home' && (
          <div className="w-full max-w-md flex justify-center items-center h-12 mx-auto mb-6">
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <SearchIcon />
                <span className="text-gray-300">Search Words...</span>
              </button>
            )}
            {isSearchOpen && (
              <div className="w-full flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Search Hiragana, Kanji, Definition..."
                  autoFocus
                />
                <CloseIcon onClick={handleCloseSearch} />
              </div>
            )}
          </div>
        )}

        <div className="w-full">
          {page === 'home' && <HomePage vocabulary={filteredVocabulary} onDelete={handleDeleteWord} />}
          {page === 'add' && <AddWordPage onWordAdded={handleAddWord} />}
        </div>
      </div>
    </div>
  );
}

// --- Initial Data ---
const initialVocabulary: Omit<Word, 'id'>[] = [
  { hiragana: 'うで', kanji: '腕', definition: 'arm', category: 'Noun' },
  { hiragana: 'こし', kanji: '腰', definition: 'waist', category: 'Noun' },
  { hiragana: 'むね', kanji: '胸', definition: 'chest', category: 'Noun' },
  { hiragana: 'せなか', kanji: '背中', definition: 'Human-back', category: 'Noun' },
  { hiragana: 'はら', kanji: '腹', definition: 'stomach, belly', category: 'Noun' },
  { hiragana: 'じゅうしゃ', kanji: '従者', definition: 'attendant', category: 'Noun' },
  { hiragana: 'しょくしゅ', kanji: '触手', definition: 'tentacle', category: 'Noun' },
  { hiragana: 'せいと', kanji: '生徒', definition: 'pupil, student', category: 'Noun' },
  { hiragana: 'ばか', kanji: '馬鹿', definition: 'idiot', category: 'Noun' },
  { hiragana: 'いらい', kanji: '依頼', definition: 'request', category: 'Noun' },
  { hiragana: 'しょり', kanji: '処理', definition: 'processing', category: 'Noun' },
  { hiragana: 'かんりょう', kanji: '完了', definition: 'completion', category: 'Noun' },
  { hiragana: 'くせん', kanji: '苦戦', definition: 'struggle', category: 'Noun' },
  { hiragana: 'とくい', kanji: '得意', definition: "one's strong point", category: 'Noun' },
  { hiragana: 'ひょうばん', kanji: '評判', definition: 'reputation', category: 'Noun' },
  { hiragana: 'しょくぎょう', kanji: '職業', definition: 'occupation', category: 'Noun' },
  { hiragana: 'ぎのう', kanji: '技能', definition: 'skill', category: 'Noun' },
  { hiragana: 'けいけん', kanji: '経験', definition: 'experience', category: 'Noun' },
  { hiragana: 'しっぱい', kanji: '失敗', definition: 'failure', category: 'Noun' },
  { hiragana: 'くんれん', kanji: '訓練', definition: 'training', category: 'Noun' },
  { hiragana: 'ちょうせん', kanji: '挑戦', definition: 'challenge', category: 'Noun' },
  { hiragana: 'かっこう', kanji: '格好', definition: 'appearance', category: 'Noun' },
  { hiragana: 'こうか', kanji: '効果', definition: 'effect', category: 'Noun' },
  { hiragana: 'すきま', kanji: '隙間', definition: 'gap', category: 'Noun' },
  { hiragana: 'こうげき', kanji: '攻撃', definition: 'attack', category: 'Noun' },
  { hiragana: 'はんだん', kanji: '判断', definition: 'judgement', category: 'Noun' },
  { hiragana: 'きょか', kanji: '許可', definition: 'permission', category: 'Noun' },
  { hiragana: 'うんどう', kanji: '運動', definition: 'exercise', category: 'Noun' },
  { hiragana: 'がまん', kanji: '我慢', definition: 'patience', category: 'Noun' },
  { hiragana: 'きんし', kanji: '禁止', definition: 'prohibition', category: 'Noun' },
  { hiragana: 'とくぎ', kanji: '特技', definition: 'special skill', category: 'Noun' },
  { hiragana: 'ふあん', kanji: '不安', definition: 'anxiety', category: 'Noun' },
  { hiragana: 'しゅうちゅう', kanji: '集中', definition: 'concentration (on a task)', category: 'Noun' },
  { hiragana: 'そうぞう', kanji: '想像', definition: 'imagination', category: 'Noun' },
  { hiragana: 'ひんぱん', kanji: '頻繁', definition: 'frequent (also a Na-Adjective)', category: 'Noun' },
  { hiragana: 'しゅるい', kanji: '種類', definition: 'variety, kind', category: 'Noun' },
  { hiragana: 'しゅみ', kanji: '趣味', definition: 'hobby', category: 'Noun' },
  { hiragana: 'まわり', kanji: '周り', definition: 'surroundings', category: 'Noun' },
  { hiragana: 'かんしん', kanji: '感心', definition: 'admiration, being impressed', category: 'Noun' },
  { hiragana: 'かんしょく', kanji: '感触', definition: 'feel (of something), touch', category: 'Noun' },
  { hiragana: 'ないしょ', kanji: '内緒', definition: 'secret (also a Na-Adjective)', category: 'Noun' },
  { hiragana: 'きたい', kanji: '期待', definition: 'expectation, hope', category: 'Noun' },
  { hiragana: 'しあい', kanji: '試合', definition: 'match, game', category: 'Noun' },
  { hiragana: 'れんしゅう', kanji: '練習', definition: 'practice, training', category: 'Noun' },
  { hiragana: 'そうじ', kanji: '掃除', definition: 'cleaning', category: 'Noun' },
  { hiragana: 'れんらく', kanji: '連絡', definition: 'contacting, (making) contact', category: 'Noun' },
  { hiragana: 'うら', kanji: '裏', definition: 'opposite side, side hidden from view, rear', category: 'Noun' },
  { hiragana: 'われめ', kanji: '破れ目', definition: 'crack, crevice, split', category: 'Noun' },
  { hiragana: 'げんじつ', kanji: '現実', definition: 'reality', category: 'Noun' },
  { hiragana: 'じゅんび', kanji: '準備', definition: 'preparation, arrangements', category: 'Noun' },
  { hiragana: 'まんぞく', kanji: '満足', definition: 'satisfaction (also a Na-Adjective)', category: 'Noun' },
  { hiragana: 'たがい', kanji: '互い', definition: 'each other, one another', category: 'Noun' },
  { hiragana: 'まなぶ', kanji: '学ぶ', definition: 'to learn', category: 'Verb' },
  { hiragana: 'みとめる', kanji: '認める', definition: 'to recognize', category: 'Verb' },
  { hiragana: 'よける', kanji: '避ける', definition: 'to avoid (physical contact with)', category: 'Verb' },
  { hiragana: 'たえる', kanji: '耐える', definition: 'to endure', category: 'Verb' },
  { hiragana: 'とまり', kanji: '泊まる', definition: 'to stay at (e.g. hotel)', category: 'Verb' },
  { hiragana: 'なぐる', kanji: '殴る', definition: 'to beat, to punch', category: 'Verb' },
  { hiragana: 'きづく', kanji: '気付く', definition: 'to notice', category: 'Verb' },
  { hiragana: 'ふくらむ', kanji: '膨らむ', definition: 'to swell (out), to get big', category: 'Verb' },
  { hiragana: 'こえる', kanji: '越える', definition: 'to cross over, to exceed, to surpass', category: 'Verb' },
  { hiragana: 'たまる', kanji: '溜まる', definition: 'accumulate', category: 'Verb' },
  { hiragana: 'いじる', kanji: '弄る', definition: 'to toy with, to play with', category: 'Verb' },
  { hiragana: 'からむ', kanji: '絡む', definition: 'to twine, to get tangled', category: 'Verb' },
  { hiragana: 'かかわる', kanji: '関わる', definition: 'to get involved(in)', category: 'Verb' },
  { hiragana: 'のぞく', kanji: '覗く', definition: 'to peek (through a keyhole, gap, etc)', category: 'Verb' },
  { hiragana: 'ぬすむ', kanji: '盗む', definition: 'to steal', category: 'Verb' },
  { hiragana: 'しかる', kanji: '叱る', definition: 'to scold', category: 'Verb' },
  { hiragana: 'はさむ', kanji: '挟む', definition: 'to put between, to sandwich between', category: 'Verb' },
  { hiragana: 'たまる', kanji: '堪る', definition: 'to bear, to endure', category: 'Verb' },
  { hiragana: 'かむ', kanji: '噛む', definition: 'to bite', category: 'Verb' },
  { hiragana: 'うける', kanji: '受ける', definition: 'to receive, to get', category: 'Verb' },
  { hiragana: 'ことわる', kanji: '断る', definition: 'to refuse, to reject, to turn down', category: 'Verb' },
  { hiragana: 'さらす', kanji: '晒す', definition: 'to expose', category: 'Verb' },
  { hiragana: 'くらべる', kanji: '比べる', definition: 'to compare, to make comparison (between)', category: 'Verb' },
  { hiragana: 'かせぐ', kanji: '稼ぐ', definition: 'to earn (income), to make (money)', category: 'Verb' },
  { hiragana: 'えんじる', kanji: '演じる', definition: 'to act (a part), to play (a role)', category: 'Verb' },
  { hiragana: 'おさえる', kanji: '抑える', definition: 'to keep within limits, to restrain', category: 'Verb' },
  { hiragana: 'はっさん', kanji: '発散', definition: "letting out (feelings), emission (this is a noun, but often used as '発散する' - to let out)", category: 'Verb' },
  { hiragana: 'えらい', kanji: '偉い', definition: 'great, excellent', category: 'I-Adjective' },
  { hiragana: 'さびしい', kanji: '寂しい', definition: 'lonely', category: 'I-Adjective' },
  { hiragana: 'かたい', kanji: '硬い', definition: 'hard, solid, tough', category: 'I-Adjective' },
  { hiragana: 'くるしい', kanji: '苦しい', definition: 'painful, difficult', category: 'I-Adjective' },
  { hiragana: 'たりない', kanji: '足りない', definition: 'insufficient, not enough', category: 'I-Adjective' },
  { hiragana: 'はげしい', kanji: '激しい', definition: 'extreme, intense', category: 'I-Adjective' },
  { hiragana: 'すずしい', kanji: '涼しい', definition: 'cool, refreshing', category: 'I-Adjective' },
  { hiragana: 'やわらかい', kanji: '柔らかい', definition: 'soft, tender', category: 'I-Adjective' },
  { hiragana: 'つらい', kanji: '辛い', definition: 'harsh, tough, painful', category: 'I-Adjective' },
  { hiragana: 'かるい', kanji: '軽い', definition: 'light (not heavy), feeling light', category: 'I-Adjective' },
  { hiragana: 'せいかく', kanji: '正確', definition: 'accurate', category: 'Na-Adjective' },
  { hiragana: 'たしか', kanji: '確か', definition: 'sure', category: 'Na-Adjective' },
  { hiragana: 'いがい', kanji: '意外', definition: 'unexpected, surprising', category: 'Na-Adjective' },
  { hiragana: 'すなお', kanji: '素直', definition: 'obedient', category: 'Na-Adjective' },
  { hiragana: 'ひんぱん', kanji: '頻繁', definition: 'frequent (also a Noun)', category: 'Na-Adjective' },
  { hiragana: 'いじわる', kanji: '意地悪', definition: 'mean, malicious, unkind, nasty', category: 'Na-Adjective' },
  { hiragana: 'きれい', kanji: '綺麗', definition: 'beautiful', category: 'Na-Adjective' },
  { hiragana: 'にがて', kanji: '苦手', definition: 'poor (at), weak (in)', category: 'Na-Adjective' },
  { hiragana: 'かんたん', kanji: '簡単', definition: 'simple, easy', category: 'Na-Adjective' },
  { hiragana: 'とうぜん', kanji: '当然', definition: 'natural, naturally', category: 'Na-Adjective' },
  { hiragana: 'ひつよう', kanji: '必要', definition: 'necessary, needed, essential', category: 'Na-Adjective' },
  { hiragana: 'めったに', kanji: '滅多に', definition: 'rarely (usually used with a negative verb)', category: 'Adverb' },
  { hiragana: 'いがい', kanji: '以外', definition: 'excluding, except (for) (This functions as a particle or suffix)', category: 'Other' },
];


