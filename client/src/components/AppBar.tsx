interface AppBarProps {
  title: string;
}

export function AppBar({ title }: AppBarProps) {
  return (
    <header className="bg-surface/80 backdrop-blur-xl text-primary px-5 pt-safe-top flex items-center justify-between h-14 sticky top-0 z-30 border-b border-border">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-accent/20 rounded-lg flex items-center justify-center">
          <span className="text-sm">🍽️</span>
        </div>
        <h1 className="font-display font-bold text-lg leading-none text-primary">{title}</h1>
      </div>
    </header>
  );
}
