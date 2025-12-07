import { defineStore } from "pinia";
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

export const useSettingsStore = defineStore("settings", {
    state: (): Settings => {
        return { ...DEFAULT_SETTINGS };
    },

    actions: {
        // 初始化设置，从文件读取
        async initialize() {
            try {
                const settings = await TauriFsJsonAdapter.readJsonFile<Settings>(CONFIG_FILE_PATH);
                this.$patch(settings);
                // 更新 i18n 语言
                i18n.global.locale.value = settings.language;
            } catch (error) {
                // 如果文件不存在，使用默认设置并保存
                await this.save();
            }
        },

        // 保存设置到文件
        async save() {
            await TauriFsJsonAdapter.writeJsonFile(CONFIG_FILE_PATH, {
                language: this.language,
            });
            // 重新初始化
            await this.initialize();
        },

        // 更新语言设置
        async updateLanguage(language: Language) {
            this.language = language;
            // 更新 i18n 语言
            i18n.global.locale.value = language;
            // 保存到文件
            await this.save();
        },
    },
});
