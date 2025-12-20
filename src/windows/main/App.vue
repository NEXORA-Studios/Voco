<script setup lang="ts">
    import { MyHeader, MyFooter } from "@s/layouts";
    import { getCurrentWindow } from "@tauri-apps/api/window";

    const $app = getCurrentWindow();
</script>

<template>
    <div class="mygrid">
        <MyHeader @minimize="$app.minimize()" @toggleMaximize="$app.toggleMaximize()" @close="$app.close()" />
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
