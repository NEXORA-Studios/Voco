import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Spinner } from "@workspace/shadcn-ui/components/spinner";
import { X } from "lucide-react";
import { Bridge, type UpdateInfo } from "@/lib/bridge";
import { openUrl } from "@tauri-apps/plugin-opener";

interface UpdateNotificationProps {
    updateInfo: UpdateInfo;
    onDismiss: () => void;
}

export function UpdateNotification({ updateInfo, onDismiss }: UpdateNotificationProps) {
    const { t } = useTranslation();
    const [installing, setInstalling] = useState(false);

    const handleOpenReleaseNotes = async () => {
        await openUrl("https://github.com/NEXORA-Studios/Voco/releases/latest");
    };

    const handleUpdate = async () => {
        setInstalling(true);
        try {
            await Bridge.updater.install();
        } catch (e) {
            console.error("Failed to install update:", e);
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div className="relative mb-4 rounded-lg border bg-card p-4 shadow-sm">
            <button
                onClick={onDismiss}
                className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
                <X className="h-3 w-3" />
            </button>

            <p className="mb-3 text-center text-sm font-medium">{t("settings.newVersionAvailable")}</p>

            <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={handleOpenReleaseNotes} disabled={installing}>
                    {t("settings.releaseNotes")}
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={installing}>
                    {installing ? (
                        <>
                            <Spinner className="mr-2 h-3 w-3" />
                            {t("settings.installing")}
                        </>
                    ) : (
                        `${t("settings.updateTo")} ${updateInfo.version}`
                    )}
                </Button>
            </div>
        </div>
    );
}
