import { createI18n } from "vue-i18n";
import zhCN from "./locales/zh-CN";
import zhTW from "./locales/zh-TW";
import enUS from "./locales/en-US";
import enGB from "./locales/en-GB";

const i18n = createI18n({
    legacy: false,
    locale: "zh-CN",
    fallbackLocale: "en-US",
    messages: {
        "zh-CN": zhCN,
        "zh-TW": zhTW,
        "en-US": enUS,
        "en-GB": enGB,
    },
});

export default i18n;
export { i18n };
