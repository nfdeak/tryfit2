import { useEffect } from 'react';
import { useFoodSearch } from '../hooks/useFoodSearch';
import { useMealReplacerStore } from '../store/mealReplacerStore';
import { FoodResultCard } from './FoodResultCard';

interface Props {
  initialQuery?: string;
  onBack: () => void;
}

export function MealReplacerResults({ initialQuery, onBack }: Props) {
  const { searchQuery, setSearchQuery, searchResults, isSearching } = useFoodSearch();
  const { selectFood, setScreen } = useMealReplacerStore();

  useEffect(() => {
    if (initialQuery && !searchQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery, searchQuery, setSearchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <button
          onClick={onBack}
          className="text-accent text-sm font-sans font-semibold flex-shrink-0"
        >
          ← Back
        </button>
        <div className="flex-1 flex items-center bg-elevated rounded-xl px-3 py-2.5 border border-border">
          <span className="text-secondary mr-2">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
            autoFocus
            className="flex-1 bg-transparent text-sm font-sans text-primary outline-none placeholder-dimmed"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-dimmed hover:text-secondary ml-1 text-lg"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {isSearching && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-secondary font-sans">Searching...</p>
          </div>
        )}

        {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm text-secondary font-sans mb-3">
              No results found for "{searchQuery}"
            </p>
            <button
              onClick={() => setScreen('ai')}
              className="bg-violet/10 border border-violet/20 text-violet text-sm font-sans font-semibold px-4 py-2.5 rounded-xl hover:bg-violet/15 transition-colors"
            >
              ✨ Describe it — let AI estimate
            </button>
          </div>
        )}

        {!isSearching && searchResults.map((food) => (
          <FoodResultCard key={food.id} food={food} onSelect={selectFood} />
        ))}

        {!isSearching && searchResults.length > 0 && (
          <p className="text-[10px] text-dimmed font-sans text-center py-2">
            Sources: Open Food Facts &middot; USDA &middot; AI
          </p>
        )}
      </div>
    </div>
  );
}
