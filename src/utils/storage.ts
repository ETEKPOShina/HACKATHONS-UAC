import type { Task, TaskGroup } from '../types/task';
import { getTodayIsoDate } from './taskLogic';

const STORAGE_KEY_TASKS = 'cadence_tasks_v1';
const STORAGE_KEY_GROUPS = 'cadence_groups_v1';
const STORAGE_KEY_THEME = 'cadence_theme_v1';

export function createSeedData(todayIso: string = getTodayIsoDate()): {
  groups: TaskGroup[];
  tasks: Task[];
} {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowIso = getTodayIsoDate(tomorrow);

  const groups: TaskGroup[] = [
    {
      id: 'grp_produit',
      name: 'Produit',
      color: 'cobalt',
      order: 0,
      createdAt: '2026-11-18T08:00:00.000Z',
    },
    {
      id: 'grp_design',
      name: 'Design',
      color: 'violet',
      order: 1,
      createdAt: '2026-11-18T08:05:00.000Z',
    },
    {
      id: 'grp_operations',
      name: 'Opérations',
      color: 'emerald',
      order: 2,
      createdAt: '2026-11-18T08:10:00.000Z',
    },
  ];

  const tasks: Task[] = [
    {
      id: 'tsk_seed_1',
      title: 'Valider le périmètre fonctionnel de la v2',
      notes: 'Confirmer les priorités avec l’équipe technique avant le sprint de lundi.',
      groupId: 'grp_produit',
      completed: false,
      priority: 'urgente',
      dueDate: todayIso,
      createdAt: '2026-11-18T08:15:00.000Z',
    },
    {
      id: 'tsk_seed_2',
      title: 'Rédiger les notes de version client',
      groupId: 'grp_produit',
      completed: false,
      priority: 'haute',
      dueDate: tomorrowIso,
      createdAt: '2026-11-18T08:20:00.000Z',
    },
    {
      id: 'tsk_seed_3',
      title: 'Auditer les retours utilisateurs d’octobre',
      groupId: 'grp_produit',
      completed: true,
      priority: 'normale',
      createdAt: '2026-11-17T14:00:00.000Z',
      completedAt: '2026-11-18T07:30:00.000Z',
    },
    {
      id: 'tsk_seed_4',
      title: 'Harmoniser l’échelle typographique et les contrastes',
      notes: 'Vérifier la lisibilité WCAG AA sur fond clair et sombre.',
      groupId: 'grp_design',
      completed: false,
      priority: 'haute',
      dueDate: todayIso,
      createdAt: '2026-11-18T08:25:00.000Z',
    },
    {
      id: 'tsk_seed_5',
      title: 'Exporter les icônes vectorielles en SVG optimisé',
      groupId: 'grp_design',
      completed: true,
      priority: 'normale',
      createdAt: '2026-11-17T11:00:00.000Z',
      completedAt: '2026-11-17T16:45:00.000Z',
    },
    {
      id: 'tsk_seed_6',
      title: 'Préparer l’ordre du jour de la réunion hebdomadaire',
      groupId: 'grp_operations',
      completed: false,
      priority: 'normale',
      dueDate: tomorrowIso,
      createdAt: '2026-11-18T08:30:00.000Z',
    },
  ];

  return { groups, tasks };
}

export function loadWorkspaceFromStorage(): {
  groups: TaskGroup[];
  tasks: Task[];
} {
  try {
    const rawGroups = window.localStorage.getItem(STORAGE_KEY_GROUPS);
    const rawTasks = window.localStorage.getItem(STORAGE_KEY_TASKS);

    if (rawGroups && rawTasks) {
      const parsedGroups = JSON.parse(rawGroups) as TaskGroup[];
      const parsedTasks = JSON.parse(rawTasks) as Task[];
      if (Array.isArray(parsedGroups) && parsedGroups.length > 0 && Array.isArray(parsedTasks)) {
        return { groups: parsedGroups, tasks: parsedTasks };
      }
    }
  } catch {
    // Fallback to seed data if storage is unavailable or corrupted
  }

  const seed = createSeedData();
  saveWorkspaceToStorage(seed.groups, seed.tasks);
  return seed;
}

export function saveWorkspaceToStorage(groups: TaskGroup[], tasks: Task[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(groups));
    window.localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // Ignore
  }
}
