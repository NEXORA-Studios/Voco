import { createApp } from "vue";
import { createPinia } from "pinia";
import { appDataDir } from "@tauri-apps/api/path";
import App from "./App.vue";
import { router } from "@wM/modules";
import { i18n, useSettingsStore } from "@s/modules";
import { TauriFs, usePackageInfoStore } from "@wM/modules";
import "@s/assets/main.css";

const APP = createApp(App).use(createPinia()).use(router).use(i18n);

// Async Init Function
(async function () {
    // Initialize Folders
    if (!(await TauriFs.exists(await appDataDir()))) {
        await TauriFs.mkdir(await appDataDir());
    }
    if (!(await TauriFs.exists("packages"))) {
        await TauriFs.mkdir("packages");
    }
    if (!(await TauriFs.exists("temp"))) {
        await TauriFs.mkdir("temp");
    }
    // Initialize Stores
    await usePackageInfoStore().initialize();
    await useSettingsStore().initialize();
})();

// 延迟挂载以避免 i18n 初始化过早
APP.mount("#app");
