import { defineStore } from 'pinia';
import { useTasksStore } from './tasks';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' },
    ],
    nextProjectId: 1,
  }),

  getters: {
    projectCount: (state) => state.projects.length,

    projectTitle: (state) => (id) =>
      state.projects.find((project) => project.id === id)?.title ?? 'Загальні',

    // Статистика кожного проєкту на основі спільного сховища завдань.
    projectStats() {
      const taskStore = useTasksStore();

      return this.projects.map((project) => {
        const projectTasks = taskStore.tasks.filter(
          (task) => task.projectId === project.id
        );

        const completedCount = projectTasks.filter(
          (task) => task.status === 'done'
        ).length;

        const uncompletedCount = projectTasks.length - completedCount;

        const completionPercent = projectTasks.length > 0
          ? Math.round((completedCount / projectTasks.length) * 100)
          : 0;

        return {
          ...project,
          taskCount: projectTasks.length,
          completedCount,
          uncompletedCount,
          completionPercent,
        };
      });
    },
  },

  actions: {
    addProject(rawTitle) {
      const title = String(rawTitle ?? '').trim();

      if (title.length < 3 || title.length > 40) {
        return null;
      }

      const duplicate = this.projects.some(
        (project) =>
          project.title.toLocaleLowerCase('uk-UA') ===
          title.toLocaleLowerCase('uk-UA')
      );

      if (duplicate) {
        return null;
      }

      const project = {
        id: `project-${this.nextProjectId}`,
        title,
      };

      this.nextProjectId += 1;
      this.projects.push(project);

      return project;
    },
  },
});