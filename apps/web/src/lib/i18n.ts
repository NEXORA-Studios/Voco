import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import zhCN from "../locales/zh-CN.json";
import zhTW from "../locales/zh-TW.json";
import enUS from "../locales/en-US.json";
import enGB from "../locales/en-GB.json";

const resources = {
    "zh-CN": { translation: zhCN },
    "zh-TW": { translation: zhTW },
    "en-US": { translation: enUS },
    "en-GB": { translation: enGB },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "en-GB",
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ["localStorage", "navigator"],
            caches: ["localStorage"],
            lookupLocalStorage: "i18nextLng",
        },
    });

export default i18n;
