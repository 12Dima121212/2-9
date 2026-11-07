<script setup>
defineProps({
  count: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <strong>{{ count }}</strong>
</template>