"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { Download, Monitor, Apple, Laptop, Check, Info, Loader2, FileArchive } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/shadcn-ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/shadcn-ui/components/tabs";
import { Badge } from "@workspace/shadcn-ui/components/badge";
import { MotionSection, MotionStagger, MotionItem } from "@/components/motion";

interface GitHubAsset {
    name: string;
    size: number;
    browser_download_url: string;
    content_type: string;
}

interface GitHubRelease {
    tag_name: string;
    name: string;
    published_at: string;
    body: string;
    html_url: string;
    assets: GitHubAsset[];
}

interface PlatformVersion {
    label: string;
    arch: string;
    size: string;
    url: string;
    filename: string;
    order: number;
}

interface PlatformData {
    id: string;
    name: string;
    icon: React.ReactNode;
    versions: PlatformVersion[];
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getPlatformFromUserAgent(): string {
    if (typeof navigator === "undefined") return "windows";
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("win")) return "windows";
    if (ua.includes("mac")) return "macos";
    if (ua.includes("linux")) return "linux";
    return "windows";
}

function parseAssets(assets: GitHubAsset[], t: (key: string) => string): PlatformData[] {
    const windows: PlatformVersion[] = [];
    const macos: PlatformVersion[] = [];
    const linux: PlatformVersion[] = [];

    for (const asset of assets) {
        const name = asset.name;
        const url = asset.browser_download_url;
        const size = formatBytes(asset.size);

        if (name.endsWith(".sig") || name === "latest.json") continue;

        if (name.includes("x64-setup.exe")) {
            windows.push({ label: t("downloads.platforms.windows.x64"), arch: "x86-64", size, url, filename: name, order: 1 });
        } else if (name.includes("x64.dmg")) {
            macos.push({ label: t("downloads.platforms.macos.dmg-x64"), arch: "x86-64", size, url, filename: name, order: 1 });
        } else if (name.includes("aarch64.dmg")) {
            macos.push({
                label: t("downloads.platforms.macos.dmg-aarch64"),
                arch: "aarch64",
                size,
                url,
                filename: name,
                order: 2,
            });
            // } else if (name.includes("x64.app.tar.gz") && !name.endsWith(".sig")) {
            //     macos.push({ label: t("downloads.platforms.macos.tarball-x64"), arch: "x86-64", size, url, filename: name });
            // } else if (name.includes("aarch64.app.tar.gz") && !name.endsWith(".sig")) {
            //     macos.push({ label: t("downloads.platforms.macos.tarball-aarch64"), arch: "aarch64", size, url, filename: name });
        } else if (name.includes("amd64.deb")) {
            linux.push({
                label: t("downloads.platforms.linux.deb-amd64"),
                arch: "x86-64",
                size,
                url,
                filename: name,
                order: 1,
            });
        } else if (name.includes("aarch64.deb")) {
            linux.push({
                label: t("downloads.platforms.linux.deb-aarch64"),
                arch: "aarch64",
                size,
                url,
                filename: name,
                order: 2,
            });
        } else if (name.includes("amd64.rpm")) {
            linux.push({
                label: t("downloads.platforms.linux.rpm-amd64"),
                arch: "x86-64",
                size,
                url,
                filename: name,
                order: 3,
            });
        } else if (name.includes("aarch64.rpm")) {
            linux.push({
                label: t("downloads.platforms.linux.rpm-aarch64"),
                arch: "aarch64",
                size,
                url,
                filename: name,
                order: 4,
            });
        } else if (name.includes("amd64.AppImage")) {
            linux.push({
                label: t("downloads.platforms.linux.appimage-amd64"),
                arch: "x86-64",
                size,
                url,
                filename: name,
                order: 5,
            });
        } else if (name.includes("aarch64.AppImage")) {
            linux.push({
                label: t("downloads.platforms.linux.appimage-aarch64"),
                arch: "aarch64",
                size,
                url,
                filename: name,
                order: 6,
            });
        }
    }

    windows.sort((a, b) => a.order - b.order);
    macos.sort((a, b) => a.order - b.order);
    linux.sort((a, b) => a.order - b.order);

    return [
        { id: "windows", name: "Windows", icon: <Monitor className="h-6 w-6" />, versions: windows },
        { id: "macos", name: "macOS", icon: <Apple className="h-6 w-6" />, versions: macos },
        { id: "linux", name: "Linux", icon: <Laptop className="h-6 w-6" />, versions: linux },
    ];
}

function formatDate(dateStr: string, locale: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function DownloadPage() {
    const t = useTranslations();
    const locale = useLocale();

    const [activeTab, setActiveTab] = useState(getPlatformFromUserAgent);
    const [release, setRelease] = useState<GitHubRelease | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/releases/latest")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load release data");
                return res.json();
            })
            .then((data: GitHubRelease) => {
                setRelease(data);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    const platforms = useMemo(() => {
        if (!release) return [];
        return parseAssets(release.assets, t);
    }, [release, t]);

    const features = [
        t("landing.features.vocabManagement.title"),
        t("landing.features.classroomChallenge.title"),
        t("landing.features.randomPicker.title"),
        t("downloads.featuresList.multiLanguage"),
        t("downloads.featuresList.autoUpdate"),
        t("downloads.featuresList.offline"),
    ];

    if (isLoading) {
        return (
            <div className="container mx-auto flex min-h-svh items-center justify-center px-4">
                <motion.div
                    className="flex flex-col items-center gap-4 -translate-y-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">{t("downloads.loading")}</p>
                </motion.div>
            </div>
        );
    }

    if (error || !release) {
        return (
            <div className="container mx-auto flex min-h-svh items-center justify-center px-4">
                <motion.div
                    className="text-center -translate-y-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}>
                    <p className="text-destructive">{t("downloads.error")}</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                        {t("downloads.retry")}
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <motion.div
                className="mb-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}>
                <Badge variant="secondary" className="mb-4">
                    {t("downloads.badge")}
                </Badge>
                <h1 className="mb-4 text-4xl font-bold">{t("downloads.title")}</h1>
                <p className="mx-auto max-w-2xl text-xl text-muted-foreground">{t("downloads.description")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                    {release.name} · {t("downloads.releaseDate", { date: formatDate(release.published_at, locale) })}
                </p>
            </motion.div>

            {/* Platform Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}>
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
                    <AnimatePresence mode="wait">
                        {platforms.map((platform) => (
                            <TabsContent key={platform.id} value={platform.id}>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}>
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
                                                        <p className="text-yellow-600/80">
                                                            {t("downloads.linuxExperimental.description")}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {platform.versions.length === 0 ? (
                                                <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-muted-foreground">
                                                    <FileArchive className="h-5 w-5" />
                                                    <span>{t("downloads.noVersions")}</span>
                                                </div>
                                            ) : (
                                                <MotionStagger className="space-y-4">
                                                    {platform.versions.map((version) => (
                                                        <MotionItem key={version.filename}>
                                                            <div className="flex items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-muted/30">
                                                                <div>
                                                                    <p className="font-medium">{version.label}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {version.arch} · {version.size}
                                                                    </p>
                                                                </div>
                                                                <Button onClick={() => window.open(version.url, "_blank")}>
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    {t("downloads.download")}
                                                                </Button>
                                                            </div>
                                                        </MotionItem>
                                                    ))}
                                                </MotionStagger>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </TabsContent>
                        ))}
                    </AnimatePresence>
                </Tabs>
            </motion.div>

            {/* Features */}
            <MotionSection className="mx-auto mt-16 max-w-2xl" delay={0.3}>
                <h2 className="mb-8 text-center text-2xl font-bold">{t("downloads.includedFeatures")}</h2>
                <MotionStagger className="grid grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <MotionItem key={index}>
                            <div className="flex items-center gap-2 rounded-lg bg-muted p-3 transition-all hover:bg-muted/80">
                                <Check className="h-5 w-5 text-primary" />
                                <span>{feature}</span>
                            </div>
                        </MotionItem>
                    ))}
                </MotionStagger>
            </MotionSection>

            {/* System Requirements */}
            <MotionSection className="mx-auto mt-16 max-w-2xl text-center" delay={0.4}>
                <h2 className="mb-4 text-2xl font-bold">{t("downloads.systemRequirements")}</h2>
                <MotionStagger className="grid gap-4 text-sm md:grid-cols-3">
                    <MotionItem>
                        <div className="rounded-lg bg-muted p-4 transition-all hover:bg-muted/80">
                            <p className="mb-2 font-medium">{t("downloads.platforms.windows.name")}</p>
                            <p className="text-muted-foreground">{t("downloads.requirements.windows")}</p>
                        </div>
                    </MotionItem>
                    <MotionItem>
                        <div className="rounded-lg bg-muted p-4 transition-all hover:bg-muted/80">
                            <p className="mb-2 font-medium">{t("downloads.platforms.macos.name")}</p>
                            <p className="text-muted-foreground">{t("downloads.requirements.macos")}</p>
                        </div>
                    </MotionItem>
                    <MotionItem>
                        <div className="rounded-lg bg-muted p-4 transition-all hover:bg-muted/80">
                            <p className="mb-2 font-medium">{t("downloads.platforms.linux.name")}</p>
                            <p className="text-muted-foreground">{t("downloads.requirements.linux")}</p>
                        </div>
                    </MotionItem>
                </MotionStagger>
            </MotionSection>
        </div>
    );
}

