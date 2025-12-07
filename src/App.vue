<script setup lang="ts">
    import MyHeader from "./layouts/MyHeader.vue";
    import MyFooter from "./layouts/MyFooter.vue";
</script>

<template>
    <div class="mygrid">
        <MyHeader />
        <RouterView />
        <MyFooter />
    </div>
</template>

<style scoped>
    .mygrid {
        display: grid;
        grid-template-rows: calc(var(--spacing) * 12) 1fr calc(var(--spacing) * 12);
        grid-template-columns: 1fr;
        height: 100%;
    }
</style>
