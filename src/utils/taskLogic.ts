import type {
  ActiveView,
  GroupColorKey,
  GroupWithTasks,
  Task,
  TaskGroup,
  TaskPriority,
  TaskStatusFilter,
  WorkspaceStats,
} from '../types/task';

export const GROUP_COLORS: Record<
  GroupColorKey,
  { label: string; dotClass: string; barClass: string; subtleTextClass: string }
> = {
  cobalt: {
    label: 'Bleu cobalt',
    dotClass: 'bg-blue-600 dark:bg-blue-500',
    barClass: 'bg-blue-600 dark:bg-blue-500',
    subtleTextClass: 'text-blue-700 dark:text-blue-400',
  },
  emerald: {
    label: 'Vert émeraude',
    dotClass: 'bg-emerald-600 dark:bg-emerald-500',
    barClass: 'bg-emerald-600 dark:bg-emerald-500',
    subtleTextClass: 'text-emerald-700 dark:text-emerald-400',
  },
  amber: {
    label: 'Ambre',
    dotClass: 'bg-amber-600 dark:bg-amber-500',
    barClass: 'bg-amber-600 dark:bg-amber-500',
    subtleTextClass: 'text-amber-700 dark:text-amber-400',
  },
  rose: {
    label: 'Corail',
    dotClass: 'bg-rose-600 dark:bg-rose-500',
    barClass: 'bg-rose-600 dark:bg-rose-500',
    subtleTextClass: 'text-rose-700 dark:text-rose-400',
  },
  violet: {
    label: 'Indigo',
    dotClass: 'bg-indigo-600 dark:bg-indigo-500',
    barClass: 'bg-indigo-600 dark:bg-indigo-500',
    subtleTextClass: 'text-indigo-700 dark:text-indigo-400',
  },
  slate: {
    label: 'Ardoise',
    dotClass: 'bg-slate-500 dark:bg-slate-400',
    barClass: 'bg-slate-600 dark:bg-slate-400',
    subtleTextClass: 'text-slate-600 dark:text-slate-400',
  },
};

export interface CreateTaskInput {
  title: string;
  notes?: string;
  groupId: string;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface ValidationResult<T> {
  ok: true;
  data: T;
}

export interface ValidationError {
  ok: false;
  error: string;
}

export function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  const timePart = Date.now().toString(36);
  return `${prefix}_${timePart}_${randomPart}`;
}

export function getTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createTask(
  input: CreateTaskInput,
  existingGroups: TaskGroup[],
  now: Date = new Date(),
): ValidationResult<Task> | ValidationError {
  const trimmedTitle = input.title.trim();
  if (!trimmedTitle) {
    return { ok: false, error: 'Le titre de la tâche est requis.' };
  }
  if (trimmedTitle.length > 180) {
    return {
      ok: false,
      error: 'Le titre ne peut pas dépasser 180 caractères.',
    };
  }
  const groupExists = existingGroups.some((g) => g.id === input.groupId);
  if (!groupExists) {
    return {
      ok: false,
      error: 'Veuillez sélectionner un groupe de tâches valide.',
    };
  }

  const trimmedNotes = input.notes?.trim();
  const dueDate = input.dueDate?.trim() || undefined;

  return {
    ok: true,
    data: {
      id: generateId('tsk'),
      title: trimmedTitle,
      notes: trimmedNotes ? trimmedNotes : undefined,
      groupId: input.groupId,
      completed: false,
      priority: input.priority ?? 'normale',
      dueDate,
      createdAt: now.toISOString(),
    },
  };
}

export function toggleTaskCompletion(
  tasks: Task[],
  taskId: string,
  now: Date = new Date(),
): Task[] {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;
    const nextCompleted = !task.completed;
    return {
      ...task,
      completed: nextCompleted,
      completedAt: nextCompleted ? now.toISOString() : undefined,
    };
  });
}

export function updateTask(
  tasks: Task[],
  taskId: string,
  patch: Partial<Pick<Task, 'title' | 'notes' | 'groupId' | 'priority' | 'dueDate'>>,
  existingGroups: TaskGroup[],
): ValidationResult<Task[]> | ValidationError {
  const target = tasks.find((t) => t.id === taskId);
  if (!target) {
    return { ok: false, error: 'Tâche introuvable.' };
  }

  const nextTitle = patch.title !== undefined ? patch.title.trim() : target.title;
  if (!nextTitle) {
    return { ok: false, error: 'Le titre de la tâche ne peut pas être vide.' };
  }

  const nextGroupId = patch.groupId ?? target.groupId;
  if (!existingGroups.some((g) => g.id === nextGroupId)) {
    return { ok: false, error: 'Groupe cible introuvable.' };
  }

  const nextNotes =
    patch.notes !== undefined ? patch.notes.trim() || undefined : target.notes;
  const nextDueDate =
    patch.dueDate !== undefined ? patch.dueDate.trim() || undefined : target.dueDate;

  return {
    ok: true,
    data: tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            title: nextTitle,
            notes: nextNotes,
            groupId: nextGroupId,
            priority: patch.priority ?? t.priority,
            dueDate: nextDueDate,
          }
        : t,
    ),
  };
}

export function moveTaskToGroup(
  tasks: Task[],
  taskId: string,
  targetGroupId: string,
  existingGroups: TaskGroup[],
): Task[] {
  if (!existingGroups.some((g) => g.id === targetGroupId)) {
    return tasks;
  }
  return tasks.map((t) =>
    t.id === taskId ? { ...t, groupId: targetGroupId } : t,
  );
}

export function deleteTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((t) => t.id !== taskId);
}

export function createGroup(
  name: string,
  color: GroupColorKey,
  existingGroups: TaskGroup[],
  now: Date = new Date(),
): ValidationResult<TaskGroup> | ValidationError {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: 'Le nom du groupe est requis.' };
  }
  if (trimmedName.length > 48) {
    return {
      ok: false,
      error: 'Le nom du groupe ne peut pas dépasser 48 caractères.',
    };
  }
  const duplicate = existingGroups.some(
    (g) => g.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: 'Un groupe portant ce nom existe déjà.' };
  }

  const maxOrder = existingGroups.reduce(
    (max, g) => Math.max(max, g.order),
    -1,
  );

  return {
    ok: true,
    data: {
      id: generateId('grp'),
      name: trimmedName,
      color,
      order: maxOrder + 1,
      createdAt: now.toISOString(),
    },
  };
}

export function renameOrUpdateGroup(
  groups: TaskGroup[],
  groupId: string,
  name: string,
  color: GroupColorKey,
): ValidationResult<TaskGroup[]> | ValidationError {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: 'Le nom du groupe ne peut pas être vide.' };
  }
  const duplicate = groups.some(
    (g) =>
      g.id !== groupId && g.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  if (duplicate) {
    return { ok: false, error: 'Un groupe portant ce nom existe déjà.' };
  }

  return {
    ok: true,
    data: groups.map((g) =>
      g.id === groupId ? { ...g, name: trimmedName, color } : g,
    ),
  };
}

export function deleteGroupAndTasks(
  groups: TaskGroup[],
  tasks: Task[],
  groupId: string,
  reassignToGroupId?: string,
): ValidationResult<{ groups: TaskGroup[]; tasks: Task[] }> | ValidationError {
  if (groups.length <= 1) {
    return {
      ok: false,
      error: 'Vous devez conserver au moins un groupe de tâches.',
    };
  }
  if (!groups.some((g) => g.id === groupId)) {
    return { ok: false, error: 'Groupe introuvable.' };
  }

  const remainingGroups = groups.filter((g) => g.id !== groupId);
  let nextTasks: Task[];

  if (reassignToGroupId && remainingGroups.some((g) => g.id === reassignToGroupId)) {
    nextTasks = tasks.map((t) =>
      t.groupId === groupId ? { ...t, groupId: reassignToGroupId } : t,
    );
  } else {
    nextTasks = tasks.filter((t) => t.groupId !== groupId);
  }

  return {
    ok: true,
    data: { groups: remainingGroups, tasks: nextTasks },
  };
}

export function sortTasksForDisplay(tasks: Task[]): Task[] {
  const priorityRank: Record<TaskPriority, number> = {
    urgente: 0,
    haute: 1,
    normale: 2,
  };

  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (!a.completed && priorityRank[a.priority] !== priorityRank[b.priority]) {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function filterTasks(
  tasks: Task[],
  options: {
    view: ActiveView;
    statusFilter: TaskStatusFilter;
    searchQuery: string;
    todayIso?: string;
  },
): Task[] {
  const today = options.todayIso ?? getTodayIsoDate();
  const normalizedQuery = options.searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    // View filter
    if (options.view.type === 'group' && task.groupId !== options.view.groupId) {
      return false;
    }
    if (options.view.type === 'today') {
      if (task.dueDate !== today) return false;
    }
    if (options.view.type === 'completed' && !task.completed) {
      return false;
    }

    // Status segmented filter (ignored when view is strictly 'completed')
    if (options.view.type !== 'completed') {
      if (options.statusFilter === 'a_faire' && task.completed) return false;
      if (options.statusFilter === 'terminees' && !task.completed) return false;
    }

    // Search filter
    if (normalizedQuery) {
      const inTitle = task.title.toLowerCase().includes(normalizedQuery);
      const inNotes = task.notes?.toLowerCase().includes(normalizedQuery) ?? false;
      if (!inTitle && !inNotes) return false;
    }

    return true;
  });
}

export function groupTasksByGroup(
  groups: TaskGroup[],
  allTasks: Task[],
  filteredTasks: Task[],
  activeView: ActiveView,
  hideEmptyWhenFiltering: boolean,
): GroupWithTasks[] {
  const sortedGroups = [...groups].sort((a, b) => a.order - b.order);

  const visibleGroups =
    activeView.type === 'group'
      ? sortedGroups.filter((g) => g.id === activeView.groupId)
      : sortedGroups;

  const grouped = visibleGroups.map((group) => {
    const groupAllTasks = allTasks.filter((t) => t.groupId === group.id);
    const groupFilteredTasks = sortTasksForDisplay(
      filteredTasks.filter((t) => t.groupId === group.id),
    );
    const totalCount = groupAllTasks.length;
    const completedCount = groupAllTasks.filter((t) => t.completed).length;
    const activeCount = totalCount - completedCount;
    const completionRate =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return {
      group,
      tasks: groupFilteredTasks,
      totalCount,
      activeCount,
      completedCount,
      completionRate,
    };
  });

  if (hideEmptyWhenFiltering && activeView.type !== 'group') {
    return grouped.filter((entry) => entry.tasks.length > 0);
  }

  return grouped;
}

export function computeWorkspaceStats(tasks: Task[]): WorkspaceStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, active, completed, completionRate };
}

export function formatDueDateFrench(
  dueDate: string | undefined,
  todayIso: string = getTodayIsoDate(),
): { label: string; isOverdue: boolean; isToday: boolean } | null {
  if (!dueDate) return null;

  if (dueDate === todayIso) {
    return { label: "Aujourd'hui", isOverdue: false, isToday: true };
  }

  const [y, m, d] = dueDate.split('-').map(Number);
  if (!y || !m || !d) return null;

  const dateObj = new Date(y, m - 1, d);
  const [ty, tm, td] = todayIso.split('-').map(Number);
  const todayObj = new Date(ty, tm - 1, td);
  const diffDays = Math.round(
    (dateObj.getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 1) {
    return { label: 'Demain', isOverdue: false, isToday: false };
  }
  if (diffDays === -1) {
    return { label: 'Hier', isOverdue: true, isToday: false };
  }

  const formatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(dateObj);

  return {
    label: formatted,
    isOverdue: diffDays < 0,
    isToday: false,
  };
}
