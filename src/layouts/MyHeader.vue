<script setup lang="ts">
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { useI18n } from "vue-i18n";

    const $app = getCurrentWindow();
    const { t } = useI18n();
</script>

<template>
    <header
        class="flex h-full justify-end items-center rounded-none bg-base-200 border-b border-base-content/25"
        data-tauri-drag-region>
        <section class="ml-4 flex items-center gap-2">
            <img src="/logo.png" alt="logo" class="size-8 rounded-full" />
            <span class="text-lg text-base-content -translate-y-0.5">{{ t("header.title") }}</span>
        </section>
        <section class="ml-auto join h-full">
            <button
                class="join-item outline-none btn h-full btn-ghost text-base-content aspect-square"
                @click="$app.minimize()">
                <i class="icon-[mynaui--minus-solid] size-6 -m-2"></i>
            </button>
            <button
                class="join-item outline-none btn h-full btn-ghost text-base-content aspect-square"
                @click="$app.toggleMaximize()">
                <i class="icon-[material-symbols--square-outline-rounded] size-4.5 -m-2"></i>
            </button>
            <button
                class="join-item outline-none btn h-full btn-ghost btn-error text-base-content aspect-square"
                @click="$app.close()">
                <i class="icon-[material-symbols--close-rounded] size-6 -m-2"></i>
            </button>
        </section>
    </header>
</template>

<style scoped></style>
