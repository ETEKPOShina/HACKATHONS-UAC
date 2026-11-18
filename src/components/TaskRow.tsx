import { Check, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskGroup } from '../types/task';
import { formatDueDateFrench } from '../utils/taskLogic';

interface TaskRowProps {
  task: Task;
  groups: TaskGroup[];
  showGroupLabel?: boolean;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMoveToGroup: (taskId: string, groupId: string) => void;
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
};

export function TaskRow({
  task,
  groups,
  showGroupLabel = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onMoveToGroup,
}: TaskRowProps) {
  const dueInfo = formatDueDateFrench(task.dueDate);
  const currentGroup = groups.find((g) => g.id === task.groupId);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      data-testid={`task-row-${task.id}`}
      className={`group flex items-start justify-between gap-3 px-4 py-3 transition-colors duration-150 ${
        task.completed
          ? 'bg-slate-50/50 dark:bg-slate-900/20'
          : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Subtle Drag Handle */}
        <span
          aria-hidden="true"
          className="hidden sm:inline-flex mt-1 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>

        {/* Accessible Completion Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={task.completed}
          aria-label={
            task.completed
              ? `Marquer « ${task.title} » comme à faire`
              : `Marquer « ${task.title} » comme terminée`
          }
          onClick={() => onToggleComplete(task.id)}
          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${
            task.completed
              ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-blue-600 dark:hover:border-blue-400 text-transparent'
          }`}
        >
          <Check
            className={`w-3.5 h-3.5 stroke-[2.5] transition-transform duration-150 ${
              task.completed ? 'scale-100' : 'scale-0'
            }`}
          />
        </button>

        {/* Title, Notes & Unboxed Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className={`text-left text-[15px] leading-snug font-medium transition-colors focus-visible:outline-none focus-visible:underline ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : 'text-slate-900 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400'
              }`}
            >
              {task.title}
            </button>
          </div>

          {task.notes && (
            <p
              className={`text-xs leading-relaxed line-clamp-2 ${
                task.completed
                  ? 'text-slate-400 dark:text-slate-600'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {task.notes}
            </p>
          )}

          {/* Unboxed Metadata with typographic separators */}
          {(showGroupLabel || dueInfo || task.priority !== 'normale') && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              {showGroupLabel && currentGroup && (
                <>
                  <span>{currentGroup.name}</span>
                  {(dueInfo || task.priority !== 'normale') && (
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                  )}
                </>
              )}

              {dueInfo && (
                <>
                  <span
                    className={`tabular-nums ${
                      !task.completed && dueInfo.isOverdue
                        ? 'text-rose-600 dark:text-rose-400 font-medium'
                        : !task.completed && dueInfo.isToday
                          ? 'text-amber-700 dark:text-amber-400 font-medium'
                          : ''
                    }`}
                  >
                    {dueInfo.label}
                  </span>
                  {task.priority !== 'normale' && (
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                      ·
                    </span>
                  )}
                </>
              )}

              {task.priority !== 'normale' && (
                <span
                  className={
                    !task.completed && task.priority === 'urgente'
                      ? 'text-rose-600 dark:text-rose-400 font-medium'
                      : !task.completed && task.priority === 'haute'
                        ? 'text-amber-700 dark:text-amber-400 font-medium'
                        : ''
                  }
                >
                  Priorité {PRIORITY_LABELS[task.priority].toLowerCase()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Inline Actions: Reassign Group, Edit, Delete */}
      <div className="flex items-center gap-1 shrink-0 pt-0.5">
        {groups.length > 1 && (
          <select
            aria-label={`Déplacer « ${task.title} » vers un groupe`}
            value={task.groupId}
            onChange={(e) => onMoveToGroup(task.id, e.target.value)}
            className="hidden sm:block max-w-[130px] truncate text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-md px-2 py-1 cursor-pointer focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
          >
            {groups.map((g) => (
              <option
                key={g.id}
                value={g.id}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                {g.name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Modifier « ${task.title} »`}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-200 dark:hover:bg-slate-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Supprimer « ${task.title} »`}
          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
