
<script setup>
import { reactive, ref, watch } from 'vue';

const props = defineProps({
  task: { type: Object, default: null },
  projects: { type: Array, required: true },
});

const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'study',
  dueDate: '',
  projectId: 'general',
});

const error = ref('');

const categoryLabels = {
  study: 'Навчання',
  work: 'Робота',
  personal: 'Особисте',
};

const titleRemaining = () => 80 - form.title.length;
const descriptionRemaining = () => 500 - form.description.length;

// Заповнюємо локальну форму даними вибраного завдання.
watch(
  () => props.task,
  (task) => {
    form.title = task?.title ?? '';
    form.description = task?.description ?? '';
    form.status = task?.status ?? 'todo';
    form.priority = task?.priority ?? 'medium';
    form.category = task?.category ?? 'study';
    form.dueDate = task?.dueDate ?? '';
    form.projectId = task?.projectId ?? 'general';
    error.value = '';
  },
  { immediate: true }
);

function submit() {
  const title = form.title.trim();
  const description = form.description.trim();

  if (title.length < 3 || title.length > 80) {
    error.value = 'Назва повинна містити від 3 до 80 символів.';
    return;
  }

  if (description.length > 500) {
    error.value = 'Опис не може перевищувати 500 символів.';
    return;
  }

  if (
    form.dueDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate)
  ) {
    error.value = 'Дата повинна мати коректний формат.';
    return;
  }

  if (!props.projects.some((project) => project.id === form.projectId)) {
    error.value = 'Оберіть проєкт зі списку.';
    return;
  }

  if (!['study', 'work', 'personal'].includes(form.category)) {
    error.value = 'Оберіть коректну категорію завдання.';
    return;
  }

  error.value = '';

  emit('save', {
    id: props.task?.id ?? null,
    title,
    description,
    status: form.status,
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate,
    projectId: form.projectId,
  });
}

function resetForm() {
  form.title = '';
  form.description = '';
  form.status = 'todo';
  form.priority = 'medium';
  form.category = 'study';
  form.dueDate = '';
  form.projectId = 'general';
  error.value = '';
}
</script>

<template>
  <section class="tf5-panel" aria-label="Форма завдання">
    <h2>{{ task ? 'Редагування завдання' : 'Нове завдання' }}</h2>

    <form class="tf5-form" @submit.prevent="submit">
      <label>
        Назва завдання *
        <input
          v-model.trim="form.title"
          type="text"
          maxlength="80"
          placeholder="Назва завдання"
        />
        <small>Залишилося символів: {{ titleRemaining() }} із 80</small>
      </label>

      <label>
        Опис
        <textarea
          v-model.trim="form.description"
          rows="3"
          maxlength="500"
          placeholder="Деталі виконання"
        ></textarea>
        <small>
          Залишилося символів: {{ descriptionRemaining() }} із 500
        </small>
      </label>

      <div class="tf5-form-grid">
        <label>
          Статус
          <select v-model="form.status">
            <option value="todo">Заплановано</option>
            <option value="progress">У роботі</option>
            <option value="done">Виконано</option>
          </select>
        </label>

        <label>
          Пріоритет
          <select v-model="form.priority">
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
        </label>
      </div>

      <div class="tf5-form-grid">
        <label>
          Категорія
          <select v-model="form.category">
            <option value="study">Навчання</option>
            <option value="work">Робота</option>
            <option value="personal">Особисте</option>
          </select>
        </label>

        <label>
          Проєкт *
          <select v-model="form.projectId">
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.title }}
            </option>
          </select>
        </label>
      </div>

      <label>
        Термін виконання
        <input v-model="form.dueDate" type="date" />
      </label>

      <div class="tf5-preview">
        <div class="tf3-eyebrow">ПОПЕРЕДНІЙ ПЕРЕГЛЯД</div>
        <h3>{{ form.title || 'Назва нового завдання' }}</h3>
        <p>{{ form.description || 'Опис завдання' }}</p>
        <p>
          {{ form.status }} · {{ form.priority }} ·
          {{ categoryLabels[form.category] }} ·
          {{ projects.find((project) => project.id === form.projectId)?.title ?? 'Загальні' }}
        </p>
      </div>

      <p v-if="error" class="tf5-error" role="alert">
        {{ error }}
      </p>

      <div class="tf5-actions">
        <button type="submit" class="tf5-btn tf5-btn--primary">
          {{ task ? 'Зберегти зміни' : 'Створити завдання' }}
        </button>

        <button
          v-if="!task"
          type="button"
          class="tf5-btn"
          @click="resetForm"
        >
          Очистити форму
        </button>

        <button
          type="button"
          class="tf5-btn"
          @click="emit('cancel')"
        >
          Скасувати
        </button>
      </div>
    </form>
  </section>
</template>
