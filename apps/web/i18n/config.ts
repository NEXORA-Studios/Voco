export type Locale = "en-GB" | "en-US" | "zh-CN" | "zh-TW";

export const defaultLocale: Locale = "en-GB";
export const locales: Locale[] = ["en-GB", "en-US", "zh-CN", "zh-TW"];

export const localeLabels: Record<Locale, string> = {
    "en-GB": "English (UK)",
    "en-US": "English (US)",
    "zh-CN": "简体中文",
    "zh-TW": "繁體中文",
};
