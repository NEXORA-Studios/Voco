import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/store/settings.store";
import { LanguageSelect } from "@/features/settings/components/LanguageSelect";

export function SettingsPage() {
    const { t } = useTranslation();
    const { loaded, load } = useSettingsStore();

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
            <div className="rounded-lg border p-4">
                <LanguageSelect />
            </div>
        </div>
    );
}
