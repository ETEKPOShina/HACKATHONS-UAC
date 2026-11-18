export type TaskPriority = 'normale' | 'haute' | 'urgente';

export type TaskStatusFilter = 'toutes' | 'a_faire' | 'terminees';

export type GroupColorKey =
  | 'cobalt'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'slate';

export interface TaskGroup {
  id: string;
  name: string;
  color: GroupColorKey;
  order: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  groupId: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;
}

export type ActiveView =
  | { type: 'all' }
  | { type: 'today' }
  | { type: 'completed' }
  | { type: 'group'; groupId: string };

export interface WorkspaceStats {
  total: number;
  active: number;
  completed: number;
  completionRate: number;
}

export interface GroupWithTasks {
  group: TaskGroup;
  tasks: Task[];
  totalCount: number;
  activeCount: number;
  completedCount: number;
  completionRate: number;
}
