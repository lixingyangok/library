
<template>
    <h1>{{ $store.state.userInfo.name }}</h1>
    <button type="button" @click="count++">
        count is: {{ count }}
    </button>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
    msg: String
})

const count = ref(0)
</script>

<style scoped>
a {
    color: #42b983;
}
</style>
