
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check for system preference or saved preference
    const savedTheme = localStorage.getItem('qorix-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Update theme when it changes
    const root = window.document.documentElement;
    root.classList.add('theme-transition');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('qorix-theme', theme);
    
    // Remove transition class after theme change is complete
    const transitionEndHandler = () => {
      root.classList.remove('theme-transition');
    };
    
    root.addEventListener('transitionend', transitionEndHandler);
    
    return () => {
      root.removeEventListener('transitionend', transitionEndHandler);
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full"
    >
      {theme === 'dark' ? (
        <Moon className="h-5 w-5 text-[#9b87f5]" />
      ) : (
        <Sun className="h-5 w-5 text-[#9b87f5]" />
      )}
    </Button>
  );
}
