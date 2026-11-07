<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import TaskListControls from '../components/TaskListControls.vue';

import { useTasksStore } from '../store/tasks';
import { useProjectsStore } from '../store/projects';

import '../css/task-components.css';
import '../css/task-list.css';

const taskStore = useTasksStore();
const projectStore = useProjectsStore();

const {
  tasks,
  visibleTasks,
  searchText,
  selectedStatus,
  selectedPriority,
  selectedProject,
  sortOrder,
  onlyUncompleted,
  onlyWithoutDueDate,
} = storeToRefs(taskStore);

const {
  projects,
  projectStats,
} = storeToRefs(projectStore);

// Локальний стан сторінки.
const showForm = ref(false);
const editingId = ref(null);
const newProjectTitle = ref('');
const newProjectError = ref('');
const saveFeedback = ref('');

const editingTask = computed(() =>
  tasks.value.find(
    (task) => task.id === editingId.value
  ) ?? null
);

// Статистика вибраного проєкту береться зі сховища Pinia.
const selectedProjectStats = computed(() =>
  projectStats.value.find(
    (project) => project.id === selectedProject.value
  ) ?? null
);

function startCreate() {
  editingId.value = null;
  showForm.value = true;
  saveFeedback.value = '';
}

function startEdit(id) {
  editingId.value = id;
  showForm.value = true;
  saveFeedback.value = '';
}

function cancelForm() {
  editingId.value = null;
  showForm.value = false;
}

function saveTask(values) {
  const saved = values.id === null
    ? taskStore.addTask(values)
    : taskStore.updateTask(values);

  if (saved) {
    saveFeedback.value = '';
    cancelForm();
  } else {
    saveFeedback.value =
      'Не вдалося зберегти завдання. Перевірте введені дані.';
  }
}

function handleDelete(id) {
  const task = tasks.value.find(
    (item) => item.id === Number(id)
  );

  if (!task) return;

  if (!window.confirm(`Видалити завдання «${task.title}»?`)) {
    return;
  }

  if (
    taskStore.deleteTask(id) &&
    editingId.value === Number(id)
  ) {
    cancelForm();
  }
}

function createProject() {
  const project = projectStore.addProject(newProjectTitle.value);

  if (!project) {
    newProjectError.value =
      'Назва має містити 3–40 символів і не повторювати інші проєкти.';
    return;
  }

  newProjectTitle.value = '';
  newProjectError.value = '';
  saveFeedback.value = '';

  // Новий проєкт одразу стає активним фільтром.
  selectedProject.value = project.id;
}

// Додаткове завдання: групова зміна статусу з підтвердженням.
function moveProjectTasksToProgress() {
  const project = selectedProjectStats.value;

  if (!project) {
    saveFeedback.value =
      'Спочатку виберіть конкретний проєкт у фільтрі.';
    return;
  }

  if (project.taskCount === 0) {
    saveFeedback.value =
      'У вибраному проєкті поки немає завдань.';
    return;
  }

  const confirmed = window.confirm(
    `Перевести всі ${project.taskCount} завдань проєкту «${project.title}» у статус «У роботі»?`
  );

  if (!confirmed) return;

  const changedCount = taskStore.setProjectTasksInProgress(
    project.id
  );

  saveFeedback.value =
    `У статус «У роботі» переведено завдань: ${changedCount}.`;
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">TASKFLOW / TASK MANAGER</div>
        <h1>Керування завданнями і проєктами</h1>
        <p>
          Pinia забезпечує спільний стан між вкладками без перезавантаження.
        </p>

        <button
          type="button"
          class="tf5-btn tf5-btn--primary tf5-new"
          @click="startCreate"
        >
          + Додати завдання
        </button>
      </section>

      <section
        class="tf5-panel tf6-project-panel"
        aria-label="Проєкти"
      >
        <h2>Мої проєкти</h2>

        <div class="tf6-project-list">
          <span
            v-for="project in projectStats"
            :key="project.id"
            class="tf6-project-pill"
          >
            {{ project.title }}
            <strong>{{ project.taskCount }}</strong>
            <span>
              {{ project.uncompletedCount }} невиконаних
              · {{ project.completionPercent }}%
            </span>
          </span>
        </div>

        <form
          class="tf6-project-form"
          @submit.prevent="createProject"
        >
          <label>
            Назва нового проєкту
            <input
              v-model="newProjectTitle"
              type="text"
              maxlength="40"
              placeholder="Наприклад: Лабораторні"
              @input="newProjectError = ''"
            />
          </label>

          <button
            type="submit"
            class="tf5-btn tf5-btn--primary"
          >
            Створити проєкт
          </button>
        </form>

        <p
          v-if="newProjectError"
          class="tf5-error"
          role="alert"
        >
          {{ newProjectError }}
        </p>

        <div class="tf6-bulk-action">
          <p>
            Масова зміна статусу застосовується до всіх завдань
            вибраного проєкту.
          </p>

          <p v-if="selectedProjectStats">
            Вибраний проєкт:
            <strong>{{ selectedProjectStats.title }}</strong>.
            Завдань: {{ selectedProjectStats.taskCount }}.
          </p>

          <p v-else>
            Для масової зміни спочатку виберіть проєкт у фільтрі нижче.
          </p>

          <button
            type="button"
            class="tf5-btn tf5-btn--primary"
            :disabled="!selectedProjectStats || selectedProjectStats.taskCount === 0"
            @click="moveProjectTasksToProgress"
          >
            Перевести всі завдання в «У роботі»
          </button>
        </div>
      </section>

      <p
        v-if="saveFeedback"
        class="tf5-error"
        role="status"
      >
        {{ saveFeedback }}
      </p>

      <TaskForm
        v-if="showForm"
        :key="editingId ?? 'new'"
        :task="editingTask"
        :projects="projects"
        @save="saveTask"
        @cancel="cancelForm"
      />

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:project="selectedProject"
        v-model:sort="sortOrder"
        v-model:onlyUncompleted="onlyUncompleted"
        v-model:onlyWithoutDueDate="onlyWithoutDueDate"
        :projects="projects"
        @reset="taskStore.resetFilters"
      />

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">TASK LIST</div>
            <h2>Список завдань</h2>
          </div>

          <div class="tf3-counter">
            Показано: {{ visibleTasks.length }} із {{ tasks.length }}
          </div>
        </div>

        <div
          v-if="visibleTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :project-title="projectStore.projectTitle(task.projectId)"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <div
          v-else
          class="tf5-empty"
        >
          <p>За поточними умовами завдань не знайдено.</p>

          <button
            type="button"
            class="tf5-btn"
            @click="taskStore.resetFilters"
          >
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>