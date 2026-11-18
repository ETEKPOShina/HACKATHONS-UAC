import { useState, type FormEvent } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type { GroupWithTasks, Task, TaskGroup } from '../types/task';
import { GROUP_COLORS } from '../utils/taskLogic';
import { TaskRow } from './TaskRow';

interface GroupSectionProps {
  entry: GroupWithTasks;
  allGroups: TaskGroup[];
  collapsed: boolean;
  onToggleCollapse: (groupId: string) => void;
  onQuickAddTask: (groupId: string, title: string) => { ok: boolean; error?: string };
  onToggleComplete: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTaskToGroup: (taskId: string, targetGroupId: string) => void;
  onEditGroup: (group: TaskGroup) => void;
  onDeleteGroup: (group: TaskGroup) => void;
  canDeleteGroup: boolean;
}

export function GroupSection({
  entry,
  allGroups,
  collapsed,
  onToggleCollapse,
  onQuickAddTask,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onMoveTaskToGroup,
  onEditGroup,
  onDeleteGroup,
  canDeleteGroup,
}: GroupSectionProps) {
  const { group, tasks, totalCount, completedCount, completionRate } = entry;
  const colorToken = GROUP_COLORS[group.color] ?? GROUP_COLORS.cobalt;

  const [quickTitle, setQuickTitle] = useState('');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleQuickSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = onQuickAddTask(group.id, quickTitle);
    if (!res.ok) {
      setQuickError(res.error ?? 'Veuillez saisir un titre.');
      return;
    }
    setQuickTitle('');
    setQuickError(null);
  };

  return (
    <section
      aria-label={`Groupe ${group.name}`}
      data-testid={`group-section-${group.id}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
          onMoveTaskToGroup(taskId, group.id);
        }
      }}
      className={`bg-white dark:bg-[#111622] border rounded-xl transition-all duration-150 overflow-hidden ${
        isDragOver
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-slate-200/90 dark:border-slate-800/90'
      }`}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onToggleCollapse(group.id)}
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? 'Déplier' : 'Replier'} le groupe ${group.name}`}
            className="flex items-center gap-2.5 min-w-0 text-left group/toggle focus-visible:outline-none focus-visible:underline"
          >
            <span className="text-slate-400 group-hover/toggle:text-slate-700 dark:text-slate-500 dark:group-hover/toggle:text-slate-300 transition-colors shrink-0">
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${colorToken.dotClass}`}
            />
            <h3 className="font-display text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100 truncate">
              {group.name}
            </h3>
          </button>

          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-1">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Right: Progress bar + Group actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="hidden sm:flex items-center gap-2"
            title={`${completionRate} % terminé`}
          >
            <div className="w-20 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${colorToken.barClass}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="font-mono text-[11px] tabular-nums text-slate-400 dark:text-slate-500 w-8 text-right">
              {completionRate}%
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onEditGroup(group)}
              aria-label={`Modifier le groupe « ${group.name} »`}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {canDeleteGroup && (
              <button
                type="button"
                onClick={() => onDeleteGroup(group)}
                aria-label={`Supprimer le groupe « ${group.name} »`}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Group Body */}
      {!collapsed && (
        <div>
          {tasks.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  groups={allGroups}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onMoveToGroup={onMoveTaskToGroup}
                />
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucune tâche affichée dans « {group.name} ».
            </div>
          )}

          {/* Inline Quick-Add Bar */}
          <form
            onSubmit={handleQuickSubmit}
            className="border-t border-slate-100 dark:border-slate-800/70 px-4 py-2.5 bg-slate-50/30 dark:bg-slate-900/20"
          >
            <div className="flex items-center gap-2.5">
              <Plus
                aria-hidden="true"
                className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0"
              />
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => {
                  setQuickTitle(e.target.value);
                  if (quickError) setQuickError(null);
                }}
                placeholder={`Ajouter une tâche dans « ${group.name} »...`}
                aria-label={`Ajouter une tâche rapide dans ${group.name}`}
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none py-1"
              />
              {quickTitle.trim().length > 0 && (
                <button
                  type="submit"
                  className="px-3 py-1 rounded-md text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
                >
                  Ajouter
                </button>
              )}
            </div>
            {quickError && (
              <p role="alert" className="mt-1 pl-6 text-xs text-rose-600 dark:text-rose-400">
                {quickError}
              </p>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
