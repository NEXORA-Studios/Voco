import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { usePackagesStore } from "@/store/packages.store";
import { PackageCard } from "@/features/packages/components/PackageCard";

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { bundles, packages, loaded, load } = usePackagesStore();
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    const toggleBundle = (slug: string) => {
        setCollapsed((prev) => ({ ...prev, [slug]: !prev[slug] }));
    };

    const getPackagesForBundle = (bundleSlug: string) => {
        const bundle = bundles.find((b) => b.slug === bundleSlug);
        if (!bundle) return [];
        return bundle.package_slugs.map((slug) => packages.find((p) => p.slug === slug)).filter(Boolean) as typeof packages;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t("packages.title")}</h1>
                <Button onClick={() => navigate("/packages/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("packages.new")}
                </Button>
            </div>

            {!loaded ? (
                <p className="text-muted-foreground">Loading...</p>
            ) : bundles.length === 0 ? (
                <p className="text-muted-foreground">{t("packages.noPackages")}</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {bundles.map((bundle) => {
                        const bundlePackages = getPackagesForBundle(bundle.slug);
                        const isCollapsed = collapsed[bundle.slug];
                        return (
                            <div key={bundle.slug} className="rounded-lg border">
                                <button
                                    className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium hover:bg-muted"
                                    onClick={() => toggleBundle(bundle.slug)}>
                                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    {bundle.name}
                                    <span className="ml-2 text-xs text-muted-foreground">({bundlePackages.length})</span>
                                </button>
                                {!isCollapsed && (
                                    <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {bundlePackages.map((pkg) => (
                                            <PackageCard key={pkg.slug} pkg={pkg} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
