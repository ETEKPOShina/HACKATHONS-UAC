import { Menu, Plus, Search, X } from 'lucide-react';
import type { RefObject } from 'react';

interface TopBarProps {
  breadcrumb: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onOpenNewTask: () => void;
  onOpenMobileMenu: () => void;
}

export function TopBar({
  breadcrumb,
  searchQuery,
  onSearchChange,
  searchInputRef,
  onOpenNewTask,
  onOpenMobileMenu,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/90 dark:bg-[#0B0E14]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Left: Mobile drawer trigger + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Ouvrir le menu de navigation"
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="sm:hidden font-display font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Cadence
            </span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
              Espace de travail
            </span>
            <span
              aria-hidden="true"
              className="hidden sm:inline text-slate-300 dark:text-slate-700 shrink-0"
            >
              /
            </span>
            <span className="hidden sm:inline font-medium text-slate-900 dark:text-slate-100 truncate">
              {breadcrumb}
            </span>
          </div>
        </div>

        {/* Right: Search + Primary CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center">
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher une tâche"
              className="w-36 sm:w-56 pl-9 pr-7 py-1.5 text-sm rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 dark:focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Effacer la recherche"
                className="absolute right-2 p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenNewTask}
            aria-label="Nouvelle tâche"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-xs transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B0E14]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">Tâche</span>
            <span className="hidden sm:inline">Nouvelle tâche</span>
          </button>
        </div>
      </div>
    </header>
  );
}
