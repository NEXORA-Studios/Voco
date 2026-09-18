import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/store/settings.store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import type { Language } from "@/types/global.d.ts";

export function LanguageSelect() {
    const { t } = useTranslation();
    const { settings, setLanguage } = useSettingsStore();

    const languages: { value: Language; label: string }[] = [
        { value: "zh-CN", label: "简体中文" },
        { value: "zh-TW", label: "繁體中文" },
        { value: "en-GB", label: "English (UK)" },
        { value: "en-US", label: "English (US)" },
    ];

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t("settings.language")}</label>
            <Select value={settings?.language ?? "zh-TW"} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                    {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
