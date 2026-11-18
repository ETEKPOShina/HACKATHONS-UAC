import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, FolderPlus, Plus, RotateCcw } from 'lucide-react';
import { GroupModal } from './components/GroupModal';
import { GroupSection } from './components/GroupSection';
import { Sidebar } from './components/Sidebar';
import { TaskModal } from './components/TaskModal';
import { TopBar } from './components/TopBar';
import type {
  ActiveView,
  GroupColorKey,
  Task,
  TaskGroup,
  TaskPriority,
  TaskStatusFilter,
} from './types/task';
import {
  loadThemePreference,
  loadWorkspaceFromStorage,
  saveThemePreference,
  saveWorkspaceToStorage,
} from './utils/storage';
import {
  computeWorkspaceStats,
  createGroup,
  createTask,
  deleteGroupAndTasks,
  deleteTask,
  filterTasks,
  groupTasksByGroup,
  moveTaskToGroup,
  renameOrUpdateGroup,
  toggleTaskCompletion,
  updateTask,
} from './utils/taskLogic';

interface DeletedTaskUndo {
  task: Task;
  timeoutId: number;
}

export default function App() {
  const initialData = useMemo(() => loadWorkspaceFromStorage(), []);
  const [groups, setGroups] = useState<TaskGroup[]>(initialData.groups);
  const [tasks, setTasks] = useState<Task[]>(initialData.tasks);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'all' });
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('toutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null);
  const [groupDeleteTarget, setGroupDeleteTarget] = useState<TaskGroup | null>(null);
  const [reassignGroupId, setReassignGroupId] = useState<string>('');

  // Undo toast
  const [undoState, setUndoState] = useState<DeletedTaskUndo | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync persistence
  useEffect(() => {
    saveWorkspaceToStorage(groups, tasks);
  }, [groups, tasks]);

  // Sync theme on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  // Keyboard shortcuts ('N' for new task, '/' for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isTyping || taskModalOpen || groupModalOpen || groupDeleteTarget) {
        return;
      }

      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setEditingTask(null);
        setTaskModalOpen(true);
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskModalOpen, groupModalOpen, groupDeleteTarget]);

  const filteredTasks = useMemo(
    () =>
      filterTasks(tasks, {
        view: activeView,
        statusFilter,
        searchQuery,
      }),
    [tasks, activeView, statusFilter, searchQuery],
  );

  const isSearchingOrFiltering =
    searchQuery.trim().length > 0 ||
    activeView.type === 'today' ||
    activeView.type === 'completed' ||
    statusFilter !== 'toutes';

  const groupedEntries = useMemo(
    () =>
      groupTasksByGroup(
        groups,
        tasks,
        filteredTasks,
        activeView,
        isSearchingOrFiltering,
      ),
    [groups, tasks, filteredTasks, activeView, isSearchingOrFiltering],
  );

  const visibleStats = useMemo(() => {
    if (activeView.type === 'group') {
      const groupTasks = tasks.filter((t) => t.groupId === activeView.groupId);
      return computeWorkspaceStats(groupTasks);
    }
    return computeWorkspaceStats(tasks);
  }, [tasks, activeView]);

  const currentViewTitle = useMemo(() => {
    if (activeView.type === 'all') return 'Tous les groupes';
    if (activeView.type === 'today') return "Aujourd'hui";
    if (activeView.type === 'completed') return 'Tâches terminées';
    const found = groups.find((g) => g.id === activeView.groupId);
    return found ? found.name : 'Groupe';
  }, [activeView, groups]);

  const defaultGroupId = useMemo(() => {
    if (activeView.type === 'group') return activeView.groupId;
    return groups[0]?.id ?? '';
  }, [activeView, groups]);

  // Handlers
  const handleQuickAddTask = (groupId: string, title: string) => {
    const res = createTask({ title, groupId }, groups);
    if (!res.ok) return { ok: false, error: res.error };
    setTasks((prev) => [res.data, ...prev]);
    return { ok: true };
  };

  const handleTaskModalSubmit = (payload: {
    id?: string;
    title: string;
    notes: string;
    groupId: string;
    priority: TaskPriority;
    dueDate: string;
  }) => {
    if (payload.id) {
      const res = updateTask(
        tasks,
        payload.id,
        {
          title: payload.title,
          notes: payload.notes,
          groupId: payload.groupId,
          priority: payload.priority,
          dueDate: payload.dueDate,
        },
        groups,
      );
      if (!res.ok) return { ok: false, error: res.error };
      setTasks(res.data);
      return { ok: true };
    }

    const res = createTask(
      {
        title: payload.title,
        notes: payload.notes,
        groupId: payload.groupId,
        priority: payload.priority,
        dueDate: payload.dueDate,
      },
      groups,
    );
    if (!res.ok) return { ok: false, error: res.error };
    setTasks((prev) => [res.data, ...prev]);
    return { ok: true };
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks((prev) => toggleTaskCompletion(prev, taskId));
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    if (undoState) {
      window.clearTimeout(undoState.timeoutId);
    }

    setTasks((prev) => deleteTask(prev, taskId));

    const timeoutId = window.setTimeout(() => {
      setUndoState(null);
    }, 5000);

    setUndoState({ task: target, timeoutId });
  };

  const handleUndoDelete = () => {
    if (!undoState) return;
    window.clearTimeout(undoState.timeoutId);
    setTasks((prev) => [undoState.task, ...prev]);
    setUndoState(null);
  };

  const handleMoveTaskToGroup = (taskId: string, targetGroupId: string) => {
    setTasks((prev) => moveTaskToGroup(prev, taskId, targetGroupId, groups));
  };

  const handleGroupModalSubmit = (payload: {
    id?: string;
    name: string;
    color: GroupColorKey;
  }) => {
    if (payload.id) {
      const res = renameOrUpdateGroup(
        groups,
        payload.id,
        payload.name,
        payload.color,
      );
      if (!res.ok) return { ok: false, error: res.error };
      setGroups(res.data);
      return { ok: true };
    }

    const res = createGroup(payload.name, payload.color, groups);
    if (!res.ok) return { ok: false, error: res.error };
    setGroups((prev) => [...prev, res.data]);
    return { ok: true };
  };

  const handleRequestDeleteGroup = (group: TaskGroup) => {
    const fallbackGroup = groups.find((g) => g.id !== group.id);
    setReassignGroupId(fallbackGroup ? fallbackGroup.id : '');
    setGroupDeleteTarget(group);
  };

  const handleConfirmDeleteGroup = (mode: 'reassign' | 'delete_tasks') => {
    if (!groupDeleteTarget) return;
    const res = deleteGroupAndTasks(
      groups,
      tasks,
      groupDeleteTarget.id,
      mode === 'reassign' ? reassignGroupId : undefined,
    );
    if (res.ok) {
      setGroups(res.data.groups);
      setTasks(res.data.tasks);
      if (
        activeView.type === 'group' &&
        activeView.groupId === groupDeleteTarget.id
      ) {
        setActiveView({ type: 'all' });
      }
    }
    setGroupDeleteTarget(null);
  };

  const handleToggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
      <Sidebar
        groups={groups}
        tasks={tasks}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenNewGroup={() => {
          setEditingGroup(null);
          setGroupModalOpen(true);
        }}
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
        }
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          breadcrumb={currentViewTitle}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          onOpenNewTask={() => {
            setEditingTask(null);
            setTaskModalOpen(true);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          {/* Workspace Page Header & Segmented Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {currentViewTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                <span>{visibleStats.active} à faire</span>
                <span aria-hidden="true" className="mx-2 text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span>{visibleStats.completed} terminées</span>
                <span aria-hidden="true" className="mx-2 text-slate-300 dark:text-slate-700">
                  ·
                </span>
                <span>{visibleStats.completionRate} % accompli</span>
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
              {groupedEntries.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const allCollapsed = groupedEntries.every(
                      (e) => collapsedGroups[e.group.id],
                    );
                    const next: Record<string, boolean> = {};
                    if (!allCollapsed) {
                      for (const e of groupedEntries) {
                        next[e.group.id] = true;
                      }
                    }
                    setCollapsedGroups(next);
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  {groupedEntries.every((e) => collapsedGroups[e.group.id])
                    ? 'Tout déplier'
                    : 'Tout replier'}
                </button>
              )}

              {activeView.type !== 'completed' && (
                <div
                  role="group"
                  aria-label="Filtrer par statut"
                  className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                >
                  {(
                    [
                      { id: 'toutes', label: 'Toutes' },
                      { id: 'a_faire', label: 'À faire' },
                      { id: 'terminees', label: 'Terminées' },
                    ] as const
                  ).map((tab) => {
                    const active = statusFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        aria-pressed={active}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Grouped Tasks List */}
          {groupedEntries.length > 0 ? (
            <div className="space-y-5">
              {groupedEntries.map((entry) => (
                <GroupSection
                  key={entry.group.id}
                  entry={entry}
                  allGroups={groups}
                  collapsed={Boolean(collapsedGroups[entry.group.id])}
                  onToggleCollapse={handleToggleGroupCollapse}
                  onQuickAddTask={handleQuickAddTask}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={(task) => {
                    setEditingTask(task);
                    setTaskModalOpen(true);
                  }}
                  onDeleteTask={handleDeleteTask}
                  onMoveTaskToGroup={handleMoveTaskToGroup}
                  onEditGroup={(group) => {
                    setEditingGroup(group);
                    setGroupModalOpen(true);
                  }}
                  onDeleteGroup={handleRequestDeleteGroup}
                  canDeleteGroup={groups.length > 1}
                />
              ))}

              {activeView.type === 'all' && !isSearchingOrFiltering && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGroup(null);
                      setGroupModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Nouveau groupe de tâches</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111622] px-6 py-14 text-center space-y-4">
              <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  {searchQuery.trim()
                    ? 'Aucune tâche correspondante'
                    : 'Aucune tâche à afficher'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery.trim()
                    ? `Aucun résultat pour « ${searchQuery} ». Essayez un autre mot-clé ou réinitialisez les filtres.`
                    : 'Créez une tâche dès maintenant pour organiser votre journée par groupes.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-1">
                {searchQuery.trim() || statusFilter !== 'toutes' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('toutes');
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setTaskModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle tâche</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Task Creation / Editing Modal */}
      <TaskModal
        open={taskModalOpen}
        editingTask={editingTask}
        defaultGroupId={defaultGroupId}
        groups={groups}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskModalSubmit}
      />

      {/* Group Creation / Editing Modal */}
      <GroupModal
        open={groupModalOpen}
        editingGroup={editingGroup}
        onClose={() => {
          setGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleGroupModalSubmit}
      />

      {/* Group Delete Confirmation Modal */}
      {groupDeleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-group-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Fermer la confirmation"
            onClick={() => setGroupDeleteTarget(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h2
              id="delete-group-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-white"
            >
              Supprimer le groupe « {groupDeleteTarget.name} »
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Que souhaitez-vous faire des tâches associées à ce groupe ?
            </p>

            {tasks.some((t) => t.groupId === groupDeleteTarget.id) && (
              <div>
                <label
                  htmlFor="reassign-group-select"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Déplacer les tâches vers
                </label>
                <select
                  id="reassign-group-select"
                  value={reassignGroupId}
                  onChange={(e) => setReassignGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  {groups
                    .filter((g) => g.id !== groupDeleteTarget.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGroupDeleteTarget(null)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteGroup('delete_tasks')}
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
              >
                Supprimer tout
              </button>
              {tasks.some((t) => t.groupId === groupDeleteTarget.id) ? (
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteGroup('reassign')}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                >
                  Déplacer et supprimer
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Undo Delete Toast */}
      {undoState && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-sm shadow-lg border border-slate-800 dark:border-slate-700"
        >
          <span className="truncate max-w-[220px]">
            Tâche « {undoState.task.title} » supprimée
          </span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 hover:text-blue-200 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
        </div>
      )}
    </div>
  );
}
