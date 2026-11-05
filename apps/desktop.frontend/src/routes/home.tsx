import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/shadcn-ui/components/tabs";
import { Button } from "@workspace/shadcn-ui/components/button";
import { usePackagesStore } from "@/store/packages.store";
import { useSettingsStore } from "@/store/settings.store";
import { PackageCard } from "@/features/packages/components/PackageCard";
import { Empty, EmptyHeader, EmptyTitle } from "@workspace/shadcn-ui/components/empty";

const UNCATEGORIZED_TAG = "__uncategorized__";

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { packages, loaded, error, load } = usePackagesStore();
    const settings = useSettingsStore((s) => s.settings);
    const [activeTab, setActiveTab] = useState("");
    useEffect(() => {
        if (!loaded) void load();
    }, [loaded, load]);
    const uncategorized = packages.filter((p) => p.tags.length === 0);
    const registeredTags = Object.entries(settings?.tags ?? {});
    const unknownTags = packages
        .flatMap((p) => p.tags.filter((slug) => !settings?.tags?.[slug]))
        .map((slug) => [slug, { name: slug, order: 100000 }] as const);
    const tags = [
        ...(uncategorized.length > 0
            ? [[UNCATEGORIZED_TAG, { name: t("packages.noCategory", { defaultValue: "Uncategorized" }), order: 0 }] as const]
            : []),
        ...registeredTags,
        ...unknownTags,
    ]
        .filter(([slug], index, all) => all.findIndex(([candidate]) => candidate === slug) === index)
        .sort((a, b) => {
            if (a[0] === UNCATEGORIZED_TAG) return -1;
            if (b[0] === UNCATEGORIZED_TAG) return 1;
            return a[1].order - b[1].order || a[0].localeCompare(b[0]);
        });
    useEffect(() => {
        if (tags.length && !tags.some(([slug]) => slug === activeTab)) setActiveTab(tags[0][0]);
    }, [tags, activeTab]);
    const forTag = (slug: string) =>
        (slug === UNCATEGORIZED_TAG ? uncategorized : packages.filter((p) => p.tags.includes(slug))).sort(
            (a, b) =>
                (a.sort_order[slug] ?? 0) - (b.sort_order[slug] ?? 0) ||
                a.name.localeCompare(b.name) ||
                a.slug.localeCompare(b.slug)
        );
    return (
        <div className="mx-auto flex h-full min-h-0 w-full flex-col px-3 py-4 sm:px-4 sm:py-5">
            <div className="mb-4 flex shrink-0 items-center justify-between">
                <h1 className="text-2xl font-bold">{t("packages.title")}</h1>
                <Button onClick={() => navigate("/packages/new")}>{t("packages.new")}</Button>
            </div>
            {!loaded ? (
                <p>{t("common.loading")}</p>
            ) : error ? (
                <div className="flex flex-col gap-3">
                    <p className="text-destructive">{error}</p>
                    <Button variant="outline" onClick={() => void load()}>
                        {t("common.retry", { defaultValue: "Retry" })}
                    </Button>
                </div>
            ) : packages.length === 0 ? (
                <p className="text-muted-foreground">{t("packages.noPackages")}</p>
            ) : (
                <Tabs className="flex min-h-0 flex-1 flex-col" value={activeTab} onValueChange={setActiveTab}>
                    <div className="mb-2 shrink-0 text-sm font-medium">{t("packages.bundle")}</div>
                    <TabsList className="shrink-0 overflow-x-auto">
                        {tags.map(([slug, tag]) => (
                            <TabsTrigger key={slug} value={slug}>
                                {tag.name} ({forTag(slug).length})
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="display-scrollbar min-h-0 flex-1 overflow-y-scroll pt-1 pr-4">
                        {tags.map(([slug]) => {
                            const tagPackages = forTag(slug);
                            return (
                                <TabsContent key={slug} value={slug}>
                                    {tagPackages.length === 0 ? (
                                        <Empty className="min-h-48 border-none">
                                            <EmptyHeader>
                                                <EmptyTitle>{t("packages.emptyTag")}</EmptyTitle>
                                            </EmptyHeader>
                                        </Empty>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {tagPackages.map((pkg) => (
                                                <PackageCard key={pkg.id} pkg={pkg} />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            );
                        })}
                    </div>
                </Tabs>
            )}
        </div>
    );
}
