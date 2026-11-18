import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeWorkspaceStats,
  createGroup,
  createTask,
  deleteGroupAndTasks,
  filterTasks,
  formatDueDateFrench,
  groupTasksByGroup,
  moveTaskToGroup,
  toggleTaskCompletion,
  updateTask,
} from './taskLogic';
import type { Task, TaskGroup } from '../types/task';

const sampleGroups: TaskGroup[] = [
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
];

test('createTask validates required title and valid group', () => {
  const emptyResult = createTask(
    { title: '   ', groupId: 'grp_produit' },
    sampleGroups,
  );
  assert.equal(emptyResult.ok, false);

  const badGroupResult = createTask(
    { title: 'Tâche valide', groupId: 'grp_inexistant' },
    sampleGroups,
  );
  assert.equal(badGroupResult.ok, false);

  const validResult = createTask(
    {
      title: '  Préparer la revue  ',
      notes: '  Points clés à aborder ',
      groupId: 'grp_produit',
      priority: 'haute',
      dueDate: '2026-11-18',
    },
    sampleGroups,
  );
  assert.equal(validResult.ok, true);
  if (validResult.ok) {
    assert.equal(validResult.data.title, 'Préparer la revue');
    assert.equal(validResult.data.notes, 'Points clés à aborder');
    assert.equal(validResult.data.completed, false);
    assert.equal(validResult.data.priority, 'haute');
  }
});

test('toggleTaskCompletion toggles completed state and timestamp', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Tâche 1',
      groupId: 'grp_produit',
      completed: false,
      priority: 'normale',
      createdAt: '2026-11-18T08:00:00.000Z',
    },
  ];

  const completed = toggleTaskCompletion(
    tasks,
    't1',
    new Date('2026-11-18T10:00:00.000Z'),
  );
  assert.equal(completed[0].completed, true);
  assert.equal(completed[0].completedAt, '2026-11-18T10:00:00.000Z');

  const reopened = toggleTaskCompletion(completed, 't1');
  assert.equal(reopened[0].completed, false);
  assert.equal(reopened[0].completedAt, undefined);
});

test('createGroup prevents empty or duplicate names (case-insensitive)', () => {
  const empty = createGroup('   ', 'emerald', sampleGroups);
  assert.equal(empty.ok, false);

  const dup = createGroup('produit', 'emerald', sampleGroups);
  assert.equal(dup.ok, false);

  const valid = createGroup('Marketing', 'emerald', sampleGroups);
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.name, 'Marketing');
    assert.equal(valid.data.order, 2);
  }
});

test('moveTaskToGroup and updateTask keep task grouped properly', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Maquette mobile',
      groupId: 'grp_produit',
      completed: false,
      priority: 'normale',
      createdAt: '2026-11-18T08:00:00.000Z',
    },
  ];

  const moved = moveTaskToGroup(tasks, 't1', 'grp_design', sampleGroups);
  assert.equal(moved[0].groupId, 'grp_design');

  const updated = updateTask(
    moved,
    't1',
    { title: 'Maquette iOS & Android', priority: 'urgente' },
    sampleGroups,
  );
  assert.equal(updated.ok, true);
  if (updated.ok) {
    assert.equal(updated.data[0].title, 'Maquette iOS & Android');
    assert.equal(updated.data[0].priority, 'urgente');
  }
});

test('filterTasks and groupTasksByGroup aggregate stats and sort active before completed', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Définir la roadmap',
      groupId: 'grp_produit',
      completed: true,
      priority: 'normale',
      dueDate: '2026-11-18',
      createdAt: '2026-11-18T07:00:00.000Z',
    },
    {
      id: 't2',
      title: 'Rédiger les specs',
      groupId: 'grp_produit',
      completed: false,
      priority: 'urgente',
      dueDate: '2026-11-18',
      createdAt: '2026-11-18T08:00:00.000Z',
    },
    {
      id: 't3',
      title: 'Icônes système',
      groupId: 'grp_design',
      completed: false,
      priority: 'normale',
      createdAt: '2026-11-18T09:00:00.000Z',
    },
  ];

  const activeOnly = filterTasks(tasks, {
    view: { type: 'all' },
    statusFilter: 'a_faire',
    searchQuery: '',
    todayIso: '2026-11-18',
  });
  assert.equal(activeOnly.length, 2);

  const todayOnly = filterTasks(tasks, {
    view: { type: 'today' },
    statusFilter: 'toutes',
    searchQuery: '',
    todayIso: '2026-11-18',
  });
  assert.equal(todayOnly.length, 2);

  const grouped = groupTasksByGroup(
    sampleGroups,
    tasks,
    tasks,
    { type: 'all' },
    false,
  );
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].tasks[0].id, 't2'); // active + urgent first
  assert.equal(grouped[0].tasks[1].id, 't1'); // completed after
  assert.equal(grouped[0].completionRate, 50);

  const stats = computeWorkspaceStats(tasks);
  assert.deepEqual(stats, {
    total: 3,
    active: 2,
    completed: 1,
    completionRate: 33,
  });
});

test('deleteGroupAndTasks prevents deleting the last group and supports reassignment', () => {
  const tasks: Task[] = [
    {
      id: 't1',
      title: 'Tâche orpheline',
      groupId: 'grp_design',
      completed: false,
      priority: 'normale',
      createdAt: '2026-11-18T09:00:00.000Z',
    },
  ];

  const res = deleteGroupAndTasks(
    sampleGroups,
    tasks,
    'grp_design',
    'grp_produit',
  );
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.groups.length, 1);
    assert.equal(res.data.tasks[0].groupId, 'grp_produit');

    const lastDelete = deleteGroupAndTasks(
      res.data.groups,
      res.data.tasks,
      'grp_produit',
    );
    assert.equal(lastDelete.ok, false);
  }
});

test('formatDueDateFrench formats today, tomorrow, yesterday, and overdue correctly', () => {
  const today = formatDueDateFrench('2026-11-18', '2026-11-18');
  assert.deepEqual(today, { label: "Aujourd'hui", isOverdue: false, isToday: true });

  const tomorrow = formatDueDateFrench('2026-11-19', '2026-11-18');
  assert.deepEqual(tomorrow, { label: 'Demain', isOverdue: false, isToday: false });

  const yesterday = formatDueDateFrench('2026-11-17', '2026-11-18');
  assert.deepEqual(yesterday, { label: 'Hier', isOverdue: true, isToday: false });
});
