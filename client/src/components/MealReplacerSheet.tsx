import { useEffect, useRef, useState } from 'react';
import { useMealReplacerStore } from '../store/mealReplacerStore';
import { MealReplacerSearch } from './MealReplacerSearch';
import { MealReplacerResults } from './MealReplacerResults';
import { MealReplacerQuantity } from './MealReplacerQuantity';
import { MealReplacerAI } from './MealReplacerAI';

export function MealReplacerSheet() {
  const { isOpen, currentScreen, closeReplacer, setScreen, setSearchQuery } = useMealReplacerStore();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const [initialQuery, setInitialQuery] = useState('');

  // Reset drag on open
  useEffect(() => {
    if (isOpen) {
      setDragY(0);
      setInitialQuery('');
    }
  }, [isOpen]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleDragEnd = () => {
    isDragging.current = false;
    if (dragY > 120) {
      closeReplacer();
    }
    setDragY(0);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeReplacer();
  };

  const handleSearchFocus = () => {
    setInitialQuery('');
    setScreen('results');
  };

  const handleQuickPick = (query: string) => {
    setInitialQuery(query);
    setSearchQuery(query);
    setScreen('results');
  };

  const handleAIMode = () => {
    setScreen('ai');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={handleOverlayClick}
      style={{ backdropFilter: 'blur(6px)' }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={handleOverlayClick} />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-dark rounded-t-2xl border-t border-border shadow-2xl flex flex-col"
        style={{
          maxHeight: '90vh',
          transform: `translateY(${dragY}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.2s ease',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 overscroll-contain">
          {currentScreen === 'search' && (
            <MealReplacerSearch
              onSearchFocus={handleSearchFocus}
              onQuickPick={handleQuickPick}
              onAIMode={handleAIMode}
            />
          )}
          {currentScreen === 'results' && (
            <MealReplacerResults
              initialQuery={initialQuery}
              onBack={() => setScreen('search')}
            />
          )}
          {currentScreen === 'quantity' && (
            <MealReplacerQuantity
              onBack={() => setScreen('results')}
            />
          )}
          {currentScreen === 'ai' && (
            <MealReplacerAI
              onBack={() => setScreen('search')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
