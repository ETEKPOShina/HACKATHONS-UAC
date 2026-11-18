import {
  Calendar,
  CheckCircle2,
  FolderPlus,
  Layers,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import type { ActiveView, Task, TaskGroup } from '../types/task';
import { GROUP_COLORS, getTodayIsoDate } from '../utils/taskLogic';

interface SidebarProps {
  groups: TaskGroup[];
  tasks: Task[];
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenNewGroup: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  groups,
  tasks,
  activeView,
  onSelectView,
  onOpenNewGroup,
  theme,
  onToggleTheme,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const todayIso = getTodayIsoDate();
  const activeCount = tasks.filter((t) => !t.completed).length;
  const todayCount = tasks.filter(
    (t) => !t.completed && t.dueDate === todayIso,
  ).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  const handleNavClick = (view: ActiveView) => {
    onSelectView(view);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#F4F5F7] dark:bg-[#0F131C] border-r border-slate-200/80 dark:border-slate-800/80 px-4 py-5 select-none">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            Cadence
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Fermer le menu latéral"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Smart Views */}
        <nav aria-label="Vues principales" className="space-y-1">
          <button
            type="button"
            onClick={() => handleNavClick({ type: 'all' })}
            aria-current={activeView.type === 'all' ? 'page' : undefined}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activeView.type === 'all'
                ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Layers className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="truncate">Tous les groupes</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick({ type: 'today' })}
            aria-current={activeView.type === 'today' ? 'page' : undefined}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activeView.type === 'today'
                ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <Calendar className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">Aujourd'hui</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {todayCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleNavClick({ type: 'completed' })}
            aria-current={activeView.type === 'completed' ? 'page' : undefined}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              activeView.type === 'completed'
                ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span className="flex items-center gap-2.5 truncate">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">Terminées</span>
            </span>
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {completedCount}
            </span>
          </button>
        </nav>

        {/* Groups List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2.5">
            <h2 className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
              Groupes de tâches
            </h2>
            <button
              type="button"
              onClick={() => {
                onOpenNewGroup();
                onCloseMobile();
              }}
              aria-label="Nouveau groupe"
              title="Nouveau groupe"
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Groupes de tâches" className="space-y-0.5">
            {sortedGroups.map((group) => {
              const isSelected =
                activeView.type === 'group' && activeView.groupId === group.id;
              const groupActiveCount = tasks.filter(
                (t) => t.groupId === group.id && !t.completed,
              ).length;
              const colorToken = GROUP_COLORS[group.color] ?? GROUP_COLORS.cobalt;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() =>
                    handleNavClick({ type: 'group', groupId: group.id })
                  }
                  aria-current={isSelected ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors duration-150 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-medium shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-2 h-2 rounded-[2px] shrink-0 ${colorToken.dotClass}`}
                    />
                    <span className="truncate">{group.name}</span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                    {groupActiveCount}
                  </span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              onOpenNewGroup();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <span aria-hidden="true">+</span>
            <span>Créer un groupe</span>
          </button>
        </div>
      </div>

      {/* Footer Utilities */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Sun className="w-3.5 h-3.5" />
            )}
            <span>{theme === 'light' ? 'Mode sombre' : 'Mode clair'}</span>
          </span>
        </button>

        <div className="px-2.5 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>Raccourcis</span>
          <span className="font-mono">N · /</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fermer l’arrière-plan du menu"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/35 backdrop-blur-[1px]"
          />
          <aside className="relative w-[272px] max-w-[82vw] h-full z-10 shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
