import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/shadcn-ui/components/tabs";
import { Button } from "@workspace/shadcn-ui/components/button";
import { usePackagesStore } from "@/store/packages.store";
import { useSettingsStore } from "@/store/settings.store";
import { PackageCard } from "@/features/packages/components/PackageCard";

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { packages, loaded, error, load } = usePackagesStore();
    const settings = useSettingsStore((s) => s.settings);
    const [activeTab, setActiveTab] = useState("");
    useEffect(() => { if (!loaded) void load(); }, [loaded, load]);
    const registeredTags = Object.entries(settings?.tags ?? {});
    const unknownTags = packages.flatMap((p) => p.tags.filter((slug) => !settings?.tags?.[slug])).map((slug) => [slug, { name: slug, order: 100000 }] as const);
    const tags = [...registeredTags, ...unknownTags].filter(([slug], index, all) => all.findIndex(([candidate]) => candidate === slug) === index).sort((a,b) => a[1].order-b[1].order || a[0].localeCompare(b[0]));
    useEffect(() => { if (tags.length && !tags.some(([slug]) => slug === activeTab)) setActiveTab(tags[0][0]); }, [tags, activeTab]);
    const forTag = (slug: string) => packages.filter((p) => p.tags.includes(slug)).sort((a,b) => (a.sort_order[slug] ?? 0)-(b.sort_order[slug] ?? 0) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
    const uncategorized = packages.filter((p) => p.tags.length === 0);
    return <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">{t("packages.title")}</h1><Button onClick={() => navigate("/packages/new")}>{t("packages.new")}</Button></div>
        {!loaded ? <p>{t("common.loading")}</p> : error ? <div className="flex flex-col gap-3"><p className="text-destructive">{error}</p><Button variant="outline" onClick={() => void load()}>{t("common.retry", { defaultValue: "Retry" })}</Button></div> : packages.length === 0 ? <p className="text-muted-foreground">{t("packages.noPackages")}</p> : <>
            {tags.length > 0 && <Tabs value={activeTab} onValueChange={setActiveTab}><TabsList>{tags.map(([slug,tag])=><TabsTrigger key={slug} value={slug}>{tag.name} ({forTag(slug).length})</TabsTrigger>)}</TabsList>{tags.map(([slug])=><TabsContent key={slug} value={slug}><div className="grid gap-4 md:grid-cols-2">{forTag(slug).map((pkg)=><PackageCard key={pkg.id} pkg={pkg}/>)}</div></TabsContent>)}</Tabs>}
            {uncategorized.length > 0 && <section className="mt-6"><h2 className="mb-3 font-semibold">{t("packages.noCategory", { defaultValue: "Uncategorized" })}</h2><div className="grid gap-4 md:grid-cols-2">{uncategorized.map((pkg)=><PackageCard key={pkg.id} pkg={pkg}/>)}</div></section>}
        </>}
    </div>;
}
