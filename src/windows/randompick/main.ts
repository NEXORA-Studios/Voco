import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@wR/App.vue";
import { i18n, useSettingsStore } from "@s/modules";
import { PresetStore } from "./modules/presetStore";
import "@s/assets/main.css";

const APP = createApp(App).use(createPinia()).use(i18n);

(async function () {
    await PresetStore.initialize();
    await useSettingsStore().initialize();
})();

APP.mount("#app");
