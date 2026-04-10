import { TabId } from '../types';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'meals', label: 'Meals', icon: '🍽️' },
  { id: 'tracker', label: 'Tracker', icon: '📅' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
  { id: 'tips', label: 'Tips', icon: '💡' },
  { id: 'profile', label: 'Profile', icon: '👤' }
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 pb-safe-bottom" style={{ background: 'rgba(15,17,23,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-app mx-auto flex border-t border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all tab-transition ${
                isActive ? 'text-accent' : 'text-dimmed'
              }`}
            >
              <span className={`text-lg leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>{tab.icon}</span>
              <span className={`text-[10px] font-sans font-medium ${isActive ? 'text-accent' : 'text-dimmed'}`}>
                {tab.label}
              </span>
              {isActive && <div className="w-4 h-0.5 bg-accent rounded-full mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
