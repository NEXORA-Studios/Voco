import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Spinner } from "@workspace/shadcn-ui/components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@workspace/shadcn-ui/components/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/shadcn-ui/components/dialog";
import { Bridge, type UpdateInfo } from "@/lib/bridge";
import { getVersion } from "@tauri-apps/api/app";

export function UpdateChecker() {
    const { t } = useTranslation();
    const [version, setVersion] = useState<string>("");
    const [checking, setChecking] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        getVersion().then(setVersion);
    }, []);

    const handleCheck = async () => {
        setChecking(true);
        setError(null);
        setUpdateInfo(null);

        try {
            const info = await Bridge.updater.check();
            setUpdateInfo(info);
            if (info.available) {
                setShowDialog(true);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setChecking(false);
        }
    };

    const handleInstall = async () => {
        setInstalling(true);
        try {
            await Bridge.updater.install();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setInstalling(false);
            setShowDialog(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">{t("settings.about")}</h3>
                    <p className="text-muted-foreground text-sm">
                        {t("settings.version")}: {version || "2.0.0"}
                    </p>
                </div>
                <Button onClick={handleCheck} disabled={checking} variant="outline">
                    {checking ? (
                        <>
                            <Spinner className="mr-2 h-4 w-4" />
                            {t("settings.checking")}
                        </>
                    ) : (
                        t("settings.checkUpdate")
                    )}
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>{t("settings.updateError")}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {updateInfo && !updateInfo.available && !error && (
                <Alert>
                    <AlertTitle>{t("settings.updateNotAvailable")}</AlertTitle>
                    <AlertDescription>{t("settings.currentVersion")}: {version || "2.0.0"}</AlertDescription>
                </Alert>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("settings.updateAvailable")}</DialogTitle>
                        <DialogDescription>
                            {t("settings.currentVersion")}: {version || "2.0.0"} → {t("settings.latestVersion")}: {updateInfo?.version}
                        </DialogDescription>
                    </DialogHeader>

                    {updateInfo?.body && (
                        <div className="space-y-2">
                            <h4 className="font-medium">{t("settings.updateBody")}</h4>
                            <div className="bg-muted max-h-40 overflow-y-auto rounded-md p-3 text-sm whitespace-pre-wrap">
                                {updateInfo.body}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={installing}>
                            {t("settings.later")}
                        </Button>
                        <Button onClick={handleInstall} disabled={installing}>
                            {installing ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    {t("settings.installing")}
                                </>
                            ) : (
                                t("settings.installUpdate")
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
