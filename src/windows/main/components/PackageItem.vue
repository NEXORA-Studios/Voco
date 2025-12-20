<script setup lang="ts">
    import { useI18n } from "vue-i18n";
    import { PackageInfo } from "@/shared/types/packageInfo";

    const { t } = useI18n();

    defineProps<{
        bundle: Record<string, PackageInfo>;
    }>();

    defineEmits(["play", "delete", "reset"]);
</script>

<template>
    <li class="list-row" v-for="(item, key) in bundle" :key="key">
        <div></div>
        <div>
            <div>{{ key }}</div>
            <div class="text-xs opacity-60">
                {{ item.description || t("packageItem.noDescription") }}
                ({{ t("packageItem.progress") }} {{ item.current + 1 }}/{{ item.total }})
            </div>
        </div>
        <button class="btn btn-square btn-soft btn-primary outline-none" @click="$emit('play', item!)">
            <svg class="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor">
                    <path d="M6 3L20 12 6 21 6 3z"></path>
                </g>
            </svg>
        </button>
        <button
            class="btn btn-square btn-soft btn-error outline-none"
            @click="($event) => $emit('delete', item!, $event)">
            <i class="icon-[material-symbols--delete-forever-outline-rounded] size-6"></i>
        </button>
        <button
            class="btn btn-square btn-soft btn-warning outline-none"
            @click="($event) => $emit('reset', item!, $event)">
            <i class="icon-[material-symbols--restore-page-outline-rounded] size-6"></i>
        </button>
    </li>
</template>
