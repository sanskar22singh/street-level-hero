import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const storageKey = 'roadReportTheme';

const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(storageKey) as 'light' | 'dark' | null;
    if (saved) return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(storageKey, theme);
  }, [theme]);

  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted"
      onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? (
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4" />
          <span className="hidden sm:inline">Light</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4" />
          <span className="hidden sm:inline">Dark</span>
        </div>
      )}
    </button>
  );
};

export default ThemeToggle;


