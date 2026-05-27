import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

import enGB from "./locales/en-GB.json";
import enUS from "./locales/en-US.json";
import zhCN from "./locales/zh-CN.json";
import zhTW from "./locales/zh-TW.json";

const messagesMap: Record<string, typeof enGB> = {
    "en-GB": enGB,
    "en-US": enUS,
    "zh-CN": zhCN,
    "zh-TW": zhTW,
};

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
        locale = routing.defaultLocale;
    }

    return {
        locale,
        messages: messagesMap[locale],
    };
});
