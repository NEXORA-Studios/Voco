import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/shadcn-ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/shadcn-ui/components/tabs";
import { Badge } from "@workspace/shadcn-ui/components/badge";
import { Download, Monitor, Apple, Laptop, Check, Info, Loader2 } from "lucide-react";

export const Route = createFileRoute("/downloads")({
    component: DownloadsPage,
});

// Types for release metadata
interface DownloadVersion {
    id: string;
    arch: string;
    size: string;
    filename: string;
}

interface PlatformData {
    versions: DownloadVersion[];
}

interface ReleaseMetadata {
    version: string;
    releaseDate: string;
    baseUrl: string;
    platforms: {
        windows: PlatformData;
        macos: PlatformData;
        linux: PlatformData;
    };
}

function getPlatformFromUserAgent(): string {
    if (typeof navigator === "undefined") return "windows";

    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("mac")) return "macos";
    if (userAgent.includes("linux")) return "linux";

    return "windows";
}

function DownloadsPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("windows");
    const [metadata, setMetadata] = useState<ReleaseMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const detectedPlatform = getPlatformFromUserAgent();
        setActiveTab(detectedPlatform);
    }, []);

    useEffect(() => {
        fetch("/release-metadata.json")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to load release metadata");
                }
                return res.json();
            })
            .then((data: ReleaseMetadata) => {
                setMetadata(data);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    const features = [
        t("landing.features.vocabManagement.title"),
        t("landing.features.classroomChallenge.title"),
        t("landing.features.randomPicker.title"),
        t("downloads.featuresList.multiLanguage"),
        t("downloads.featuresList.autoUpdate"),
        t("downloads.featuresList.offline"),
    ];

    const handleDownload = (filename: string) => {
        if (!metadata) {
            console.error("Metadata is not present, cannot download.");
            return;
        }
        const url = `${metadata.baseUrl}/${filename}`;
        window.open(url, "_blank");
    };

    if (isLoading) {
        return (
            <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">{t("downloads.loading")}</p>
                </div>
            </div>
        );
    }

    if (error || !metadata) {
        return (
            <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-destructive">{t("downloads.error")}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                        {t("downloads.retry")}
                    </Button>
                </div>
            </div>
        );
    }

    const platforms = [
        {
            id: "windows",
            name: t("downloads.platforms.windows.name"),
            icon: <Monitor className="h-6 w-6" />,
            versions: metadata.platforms.windows.versions.map((v) => ({
                ...v,
                label: t(`downloads.platforms.windows.${v.id.replace("windows-", "")}`, v.id),
            })),
        },
        {
            id: "macos",
            name: t("downloads.platforms.macos.name"),
            icon: <Apple className="h-6 w-6" />,
            versions: metadata.platforms.macos.versions.map((v) => ({
                ...v,
                label: t(`downloads.platforms.macos.${v.id.replace("macos-", "")}`, v.id),
            })),
        },
        {
            id: "linux",
            name: t("downloads.platforms.linux.name"),
            icon: <Laptop className="h-6 w-6" />,
            versions: metadata.platforms.linux.versions.map((v) => ({
                ...v,
                label: t(`downloads.platforms.linux.${v.id.replace("linux-", "")}`, v.id),
            })),
        },
    ];

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-12 text-center">
                <Badge variant="secondary" className="mb-4">
                    {t("downloads.badge")}
                </Badge>
                <h1 className="mb-4 text-4xl font-bold">{t("downloads.title")}</h1>
                <p className="mx-auto max-w-2xl text-xl text-muted-foreground">{t("downloads.description")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t("downloads.versionInfo")} {metadata.version} ({metadata.releaseDate})
                </p>
            </div>

            {/* Platform Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mx-auto max-w-3xl">
                <TabsList className="grid w-full grid-cols-3">
                    {platforms.map((platform) => (
                        <TabsTrigger key={platform.id} value={platform.id}>
                            <span className="flex items-center gap-2">
                                {platform.icon}
                                {platform.name}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
                {platforms.map((platform) => (
                    <TabsContent key={platform.id} value={platform.id}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {platform.icon}
                                    {platform.name} {t("downloads.version")}
                                </CardTitle>
                                <CardDescription>{t("downloads.selectVersion")}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {platform.id === "windows" && (
                                    <div className="flex items-start gap-3 rounded-lg bg-muted p-4 text-sm">
                                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                        <p className="text-muted-foreground">{t("downloads.windowsArmNotice")}</p>
                                    </div>
                                )}
                                {platform.id === "linux" && (
                                    <div className="flex items-start gap-3 rounded-lg bg-yellow-500/10 p-4 text-sm">
                                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                                        <div className="text-yellow-700">
                                            <p className="font-medium">{t("downloads.linuxExperimental.title")}</p>
                                            <p className="text-yellow-600/80">{t("downloads.linuxExperimental.description")}</p>
                                        </div>
                                    </div>
                                )}
                                {platform.versions.map((version) => (
                                    <div key={version.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div>
                                            <p className="font-medium">{version.label}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {t(`downloads.arch.${version.arch}`, version.arch)} · {version.size}
                                            </p>
                                        </div>
                                        <Button onClick={() => handleDownload(version.filename)}>
                                            <Download className="mr-2 h-4 w-4" />
                                            {t("downloads.download")}
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Features */}
            <div className="mx-auto mt-16 max-w-2xl">
                <h2 className="mb-8 text-center text-2xl font-bold">{t("downloads.includedFeatures")}</h2>
                <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-lg bg-muted p-3">
                            <Check className="h-5 w-5 text-primary" />
                            <span>{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Requirements */}
            <div className="mx-auto mt-16 max-w-2xl text-center">
                <h2 className="mb-4 text-2xl font-bold">{t("downloads.systemRequirements")}</h2>
                <div className="grid gap-4 text-sm md:grid-cols-3">
                    <div className="rounded-lg bg-muted p-4">
                        <p className="mb-2 font-medium">{t("downloads.platforms.windows.name")}</p>
                        <p className="text-muted-foreground">{t("downloads.requirements.windows")}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                        <p className="mb-2 font-medium">{t("downloads.platforms.macos.name")}</p>
                        <p className="text-muted-foreground">{t("downloads.requirements.macos")}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                        <p className="mb-2 font-medium">{t("downloads.platforms.linux.name")}</p>
                        <p className="text-muted-foreground">{t("downloads.requirements.linux")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

