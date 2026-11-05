import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/shadcn-ui/components/tabs";
import { useSettingsStore } from "@/store/settings.store";
import { LanguageSelect } from "@/features/settings/components/LanguageSelect";
import { TagsSettings } from "@/features/settings/components/TagsSettings";
import { UpdateChecker } from "@/features/settings/components/UpdateChecker";

export function SettingsPage() {
    const { t } = useTranslation();
    const { loaded, error, load } = useSettingsStore();

    useEffect(() => {
        if (!loaded) void load();
    }, [loaded, load]);

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
            {error && <p className="text-destructive">{error}</p>}
            {!loaded && !error && <p>{t("common.loading")}</p>}
            {loaded && !error && (
                <Tabs defaultValue="general" className="flex flex-col gap-4">
                    <TabsList>
                        <TabsTrigger value="general">{t("settings.generalTab")}</TabsTrigger>
                        <TabsTrigger value="tags">{t("settings.tagsTab")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className="flex flex-col gap-4">
                        <div className="rounded-lg border p-4">
                            <LanguageSelect />
                        </div>
                        <div className="rounded-lg border p-4">
                            <UpdateChecker />
                        </div>
                    </TabsContent>
                    <TabsContent value="tags" className="rounded-lg border p-4">
                        <TagsSettings />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
