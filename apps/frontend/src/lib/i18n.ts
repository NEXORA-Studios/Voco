import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "@/locales/zh-CN.json";
import zhTW from "@/locales/zh-TW.json";
import enGB from "@/locales/en-GB.json";
import enUS from "@/locales/en-US.json";

const resources = {
    "zh-CN": { translation: zhCN },
    "zh-TW": { translation: zhTW },
    "en-GB": { translation: enGB },
    "en-US": { translation: enUS },
};

i18n.use(initReactI18next).init({
    resources,
    lng: "zh-TW",
    fallbackLng: "zh-TW",
    interpolation: { escapeValue: false },
});

export default i18n;
