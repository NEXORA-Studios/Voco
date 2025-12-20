<script setup lang="ts">
    import { ref } from "vue";
    import { ToastItem } from ".";

    const toasts = ref<
        { type: "info" | "success" | "warning" | "error"; message?: string; translate?: string | [string, any] }[]
    >([]);

    function addToast(toast: {
        type: "info" | "success" | "warning" | "error";
        message?: string;
        translate?: string | [string, any];
    }) {
        toasts.value.push(toast);
        // 当心超限显示
    }

    defineExpose({
        addToast,
    });
</script>

<template>
    <div>
        <div class="toast">
            <ToastItem v-for="toast in toasts" :key="toast.message || toast.translate?.[0]" :type="toast.type">
                {{
                    toast.message || toast.translate instanceof Array
                        ? $t(toast.translate?.[0] || "", toast.translate?.[1] || {})
                        : $t(toast.translate || "") || ""
                }}
            </ToastItem>
        </div>
    </div>
    <div class="hidden alert alert-info"></div>
    <div class="hidden alert alert-success"></div>
    <div class="hidden alert alert-warning"></div>
    <div class="hidden alert alert-error"></div>
</template>
