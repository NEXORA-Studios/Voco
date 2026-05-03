import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/shadcn-ui/components/tabs";
import { usePackagesStore } from "@/store/packages.store";
import { PackageCard } from "@/features/packages/components/PackageCard";
import { Card, CardContent } from "@workspace/shadcn-ui/components/card";
import { Separator } from "@workspace/shadcn-ui/components/separator";
import { PickerButton } from "@/components/PickerButton";

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { bundles, packages, loaded, load } = usePackagesStore();
    const [activeTab, setActiveTab] = useState<string>("");

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    // Set default active tab when bundles are loaded
    useEffect(() => {
        if (bundles.length > 0 && !activeTab) {
            setActiveTab(bundles[0].slug);
        }
    }, [bundles, activeTab]);

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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <Card className="py-1">
                        <CardContent className="px-1">
                            <TabsList className="flex-wrap bg-transparent">
                                {bundles.map((bundle) => {
                                    const bundlePackages = getPackagesForBundle(bundle.slug);
                                    return (
                                        <TabsTrigger
                                            key={bundle.slug}
                                            value={bundle.slug}
                                            className="flex items-center space-x-0.5">
                                            {bundle.name}
                                            <span className="text-xs text-muted-foreground">({bundlePackages.length})</span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </CardContent>
                    </Card>
                    <Separator className="mt-2 mb-4" />
                    {bundles.map((bundle) => {
                        const bundlePackages = getPackagesForBundle(bundle.slug);
                        return (
                            <TabsContent key={bundle.slug} value={bundle.slug}>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {bundlePackages.map((pkg) => (
                                        <PackageCard key={pkg.slug} pkg={pkg} />
                                    ))}
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            )}
            <PickerButton />
        </div>
    );
}
