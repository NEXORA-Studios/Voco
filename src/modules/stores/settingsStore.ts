import { defineStore } from "pinia";
import { ref } from "vue";
import { TauriFsJsonAdapter } from "../tauri/fs";
import { i18n } from "../i18n";

type Language = "zh-CN" | "zh-TW" | "en-US" | "en-GB";

interface Settings {
    language: Language;
}

const DEFAULT_SETTINGS: Settings = {
    language: "en-GB",
};

const CONFIG_FILE_PATH = "config.json";

export const useSettingsStore = defineStore("settings", () => {
    const language = ref<Language>(DEFAULT_SETTINGS.language);

    async function initialize() {
        try {
            const settings = await TauriFsJsonAdapter.readJsonFile<Settings>(CONFIG_FILE_PATH);
            language.value = settings.language;
        } catch {
            await save(); // 文件不存在 → 创建默认配置
        }

        // 同步 i18n
        i18n.global.locale.value = language.value;
    }

    async function save() {
        await TauriFsJsonAdapter.writeJsonFile(CONFIG_FILE_PATH, {
            language: language.value,
        });
        // 同步 i18n
        await initialize();
    }

    async function updateLanguage(newLang: Language) {
        language.value = newLang;
        i18n.global.locale.value = newLang;
        await save();
    }

    return {
        language,
        initialize,
        save,
        updateLanguage,
    };
});
