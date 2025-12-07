<script setup lang="ts">
    import { ref } from "vue";
    import { useSettingsStore } from "../modules/stores/settingsStore";

    const settingsStore = useSettingsStore();
    const selectedLanguage = ref(settingsStore.language);

    const saveSettings = async () => {
        await settingsStore.updateLanguage(selectedLanguage.value);
    };
</script>

<template>
    <div class="card bg-base-100 w-full max-w-4xl mx-auto py-12">
        <section class="flex justify-end">
            <h2 class="card-title text-2xl font-bold">{{ $t("settings.title") }}</h2>
            <button @click="$router.push('/')" class="btn btn-primary btn-outline ml-auto mr-2">
                {{ $t("settings.home") }}
            </button>
            <button @click="saveSettings" class="btn btn-primary">{{ $t("settings.save") }}</button>
        </section>

        <div class="space-y-6 mt-6 px-4">
            <!-- 语言设置 -->
            <div class="flex items-center justify-between">
                <label class="text-lg font-medium">{{ $t("settings.options.language") }}</label>
                <select v-model="selectedLanguage" class="select select-primary w-full max-w-xs outline-none">
                    <option value="zh-CN">简体中文 (中国大陆)</option>
                    <option value="zh-TW">繁體中文 (中國臺灣)</option>
                    <option value="en-GB">English (British)</option>
                    <option value="en-US">English (American)</option>
                </select>
            </div>
        </div>
    </div>
</template>
