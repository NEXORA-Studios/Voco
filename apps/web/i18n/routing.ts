import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
    locales: ["en-GB", "en-US", "zh-CN", "zh-TW"],
    defaultLocale: "en-GB",
    localePrefix: "always",
});
