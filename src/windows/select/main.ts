import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/windows/select/App.vue";
import "@s/assets/main.css";
import { i18n, useSettingsStore } from "@/shared/modules";

const APP = createApp(App).use(createPinia()).use(i18n);
(async () => {
    await useSettingsStore().initialize();
})();

APP.mount("#app");
