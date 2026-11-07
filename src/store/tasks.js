import { defineStore } from 'pinia';
import initialTasks from '../data/tasks';
import { useProjectsStore } from './projects';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];
const allowedCategories = ['study', 'work', 'personal'];

function normalizeValues(values, projects) {
  const requestedProject = String(values.projectId ?? 'general');

  const projectId = projects.some(
    (project) => project.id === requestedProject
  )
    ? requestedProject
    : 'general';

  return {
    title: String(values.title ?? '').trim(),
    description: String(values.description ?? '').trim(),

    status: allowedStatuses.includes(values.status)
      ? values.status
      : 'todo',

    priority: allowedPriorities.includes(values.priority)
      ? values.priority
      : 'medium',

    category: allowedCategories.includes(values.category)
      ? values.category
      : 'study',

    dueDate: String(values.dueDate ?? ''),
    projectId,
  };
}

function isValidTask(values) {
  if (values.title.length < 3 || values.title.length > 80) return false;
  if (values.description.length > 500) return false;
  if (!allowedStatuses.includes(values.status)) return false;
  if (!allowedPriorities.includes(values.priority)) return false;
  if (!allowedCategories.includes(values.category)) return false;

  if (
    values.dueDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)
  ) {
    return false;
  }

  return true;
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks.map((task) => ({
      ...task,
      category: task.category ?? 'study',
      projectId: task.projectId ?? 'general',
    })),

    searchText: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedProject: 'all',
    sortOrder: 'newest',

    onlyUncompleted: false,
    onlyWithoutDueDate: false,
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,

    completedTasks: (state) =>
      state.tasks.filter((task) => task.status === 'done').length,

    progressTasks: (state) =>
      state.tasks.filter((task) => task.status === 'progress').length,

    activeTasks: (state) => {
      const rank = {
        high: 3,
        medium: 2,
        low: 1,
      };

      return state.tasks
        .filter((task) => task.status !== 'done')
        .slice()
        .sort(
          (a, b) =>
            rank[b.priority] - rank[a.priority] || b.id - a.id
        )
        .slice(0, 3);
    },

    visibleTasks: (state) => {
      const term = state.searchText.trim().toLocaleLowerCase('uk-UA');

      const priorityRank = {
        high: 3,
        medium: 2,
        low: 1,
      };

      const statusRank = {
        progress: 1,
        todo: 2,
        done: 3,
      };

      const filtered = state.tasks.filter((task) => {
        const text = `${task.title} ${task.description ?? ''}`
          .toLocaleLowerCase('uk-UA');

        const matchesText = !term || text.includes(term);

        const matchesStatus =
          state.selectedStatus === 'all' ||
          task.status === state.selectedStatus;

        const matchesPriority =
          state.selectedPriority === 'all' ||
          task.priority === state.selectedPriority;

        const matchesProject =
          state.selectedProject === 'all' ||
          task.projectId === state.selectedProject;

        const matchesUncompleted =
          !state.onlyUncompleted ||
          task.status !== 'done';

        // Додатковий фільтр: завдання без дати виконання.
        const matchesNoDate =
          !state.onlyWithoutDueDate ||
          !task.dueDate;

        return (
          matchesText &&
          matchesStatus &&
          matchesPriority &&
          matchesProject &&
          matchesUncompleted &&
          matchesNoDate
        );
      });

      // Сортуємо копію масиву, не змінюючи state.tasks.
      return filtered.sort((a, b) => {
        if (state.sortOrder === 'title') {
          return (
            a.title.localeCompare(b.title, 'uk-UA') ||
            a.id - b.id
          );
        }

        if (state.sortOrder === 'priority') {
          return (
            priorityRank[b.priority] - priorityRank[a.priority] ||
            b.id - a.id
          );
        }

        if (state.sortOrder === 'status') {
          return (
            statusRank[a.status] - statusRank[b.status] ||
            b.id - a.id
          );
        }

        if (
          state.sortOrder === 'dueDate' ||
          state.sortOrder === 'dueDateDesc'
        ) {
          if (!a.dueDate && b.dueDate) return 1;
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && !b.dueDate) return b.id - a.id;

          return state.sortOrder === 'dueDateDesc'
            ? b.dueDate.localeCompare(a.dueDate) || b.id - a.id
            : a.dueDate.localeCompare(b.dueDate) || b.id - a.id;
        }

        return b.id - a.id;
      });
    },
  },

  actions: {
    addTask(values) {
      const projectStore = useProjectsStore();

      const normalized = normalizeValues(
        values,
        projectStore.projects
      );

      if (!isValidTask(normalized)) return false;

      const duplicate = this.tasks.some(
        (task) =>
          task.title.trim().toLowerCase() ===
          normalized.title.toLowerCase()
      );

      if (duplicate) return false;

      const nextId =
        Math.max(0, ...this.tasks.map((task) => Number(task.id) || 0)) + 1;

      this.tasks.unshift({
        id: nextId,
        ...normalized,
      });

      return true;
    },

    updateTask(values) {
      const task = this.tasks.find(
        (item) => item.id === Number(values.id)
      );

      if (!task) return false;

      const projectStore = useProjectsStore();

      const normalized = normalizeValues(
        values,
        projectStore.projects
      );

      if (!isValidTask(normalized)) return false;

      Object.assign(task, normalized);

      return true;
    },

    deleteTask(id) {
      const index = this.tasks.findIndex(
        (task) => task.id === Number(id)
      );

      if (index === -1) return false;

      this.tasks.splice(index, 1);

      return true;
    },

    setTaskStatus({ id, status }) {
      if (!allowedStatuses.includes(status)) return false;

      const task = this.tasks.find(
        (item) => item.id === Number(id)
      );

      if (!task) return false;

      task.status = status;

      return true;
    },

    setTaskPriority({ id, priority }) {
      if (!allowedPriorities.includes(priority)) return false;

      const task = this.tasks.find(
        (item) => item.id === Number(id)
      );

      if (!task) return false;

      task.priority = priority;

      return true;
    },

    // Масове переведення всіх завдань проєкту в статус «У роботі».
    setProjectTasksInProgress(projectId) {
      const projectStore = useProjectsStore();

      const projectExists = projectStore.projects.some(
        (project) => project.id === projectId
      );

      if (!projectExists) return 0;

      let changedCount = 0;

      this.tasks.forEach((task) => {
        if (
          task.projectId === projectId &&
          task.status !== 'progress'
        ) {
          task.status = 'progress';
          changedCount += 1;
        }
      });

      return changedCount;
    },

    resetFilters() {
      this.searchText = '';
      this.selectedStatus = 'all';
      this.selectedPriority = 'all';
      this.selectedProject = 'all';
      this.sortOrder = 'newest';
      this.onlyUncompleted = false;
      this.onlyWithoutDueDate = false;
    },
  },
});