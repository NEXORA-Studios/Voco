import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./modules/router";
import i18n from "./modules/i18n";

const APP = createApp(App).use(createPinia()).use(router).use(i18n);

import "./assets/main.css";
import { TauriFs, TauriFsJsonAdapter } from "./modules/tauri/fs";
import { appDataDir } from "@tauri-apps/api/path";
import { usePackageInfoStore } from "./modules/stores/packageInfoStore";
import { useSettingsStore } from "./modules/stores/settingsStore";

// Async Init Function
(async function () {
    if (!(await TauriFs.exists(await appDataDir()))) {
        await TauriFs.mkdir(await appDataDir());
    }
    if (!(await TauriFs.exists("packages"))) {
        await TauriFs.mkdir("packages");
    }
    if (!(await TauriFs.exists("data.json"))) {
        await TauriFs.createFile("data.json");
    }
    try {
        const data = await TauriFsJsonAdapter.readJsonFile<{ packages: any[]; version: number }>("data.json");
        if (typeof data["packages"] !== "object") throw new Error();
        if (typeof data["version"] !== "number") throw new Error();
    } catch {
        await TauriFs.copyFile("data.json", "data.json.bak");
        await TauriFs.remove("data.json");
        await TauriFsJsonAdapter.writeJsonFile("data.json", {
            version: 1,
            packages: [],
        });
    }
    await usePackageInfoStore().update();
    await useSettingsStore().initialize();
    
})();

// 延迟挂载以避免 i18n 初始化过早
APP.mount("#app");
