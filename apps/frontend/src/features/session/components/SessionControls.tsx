import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@workspace/shadcn-ui/components/button";
import { useSessionStore } from "@/store/session.store";
import { usePackagesStore } from "@/store/packages.store";
import { SelectDialog } from "@/components/SelectDialog";

export function SessionControls() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pkg, state, mode, remaining, spin, reveal, next, reset } = useSessionStore();
    const { resetPackageSort } = usePackagesStore();

    const [showSortDialog, setShowSortDialog] = useState(false);

    const total = pkg?.entries.length ?? 0;
    const current = remaining.length;

    const handleRestart = (newMethod: string) => {
        if (pkg) {
            resetPackageSort(pkg.slug, newMethod as "shuffle" | "alphabetical" | "original");
        }
        reset();
        navigate("/");
    };

    const sortOptions = [
        { value: "shuffle", label: t("packages.sort_shuffle") },
        { value: "alphabetical", label: t("packages.sort_alphabetical") },
        { value: "original", label: t("packages.sort_original") },
    ];

    return (
        <>
            <div className="pointer-events-none absolute inset-x-0 bottom-14 z-20 flex justify-center px-4">
                <div className="pointer-events-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
                    {state.status === "idle" && (
                        <Button size="lg" className="w-full" onClick={spin}>
                            {t("session.start")}
                        </Button>
                    )}

                    {state.status === "spinning" && (
                        <div className="flex flex-col items-center gap-1 py-1">
                            <p className="text-sm font-medium text-muted-foreground">{t("session.spinning")}</p>
                            <p className="text-xs text-muted-foreground">
                                {current} / {total} {t("packages.entries")}
                            </p>
                        </div>
                    )}

                    {state.status === "paused" && (
                        <div className="flex w-full flex-col items-center gap-2">
                            <div className="flex w-full gap-2">
                                {mode === "both" ? (
                                    <Button variant="outline" className="flex-1" onClick={reveal}>
                                        {t("session.showTranslation")}
                                    </Button>
                                ) : (
                                    <Button className="flex-1" onClick={next}>
                                        {t("session.next")}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {current} / {total} {t("packages.entries")}
                            </p>
                        </div>
                    )}

                    {state.status === "revealed" && (
                        <div className="flex w-full flex-col items-center gap-2">
                            <Button className="w-full" onClick={next}>
                                {t("session.next")}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {current} / {total} {t("packages.entries")}
                            </p>
                        </div>
                    )}

                    {state.status === "done" && (
                        <div className="flex w-full flex-col items-center gap-2">
                            <div className="flex w-full gap-2">
                                <Button className="flex-1" onClick={() => setShowSortDialog(true)}>
                                    {t("session.restart")}
                                </Button>
                                <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                                    {t("session.back")}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <SelectDialog
                open={showSortDialog}
                onOpenChange={setShowSortDialog}
                title={t("packages.sort")}
                description={t("packages.form.sortMethod")}
                options={sortOptions}
                defaultValue={pkg?.sort_method}
                confirmLabel={t("session.restart")}
                cancelLabel={t("packages.form.cancel")}
                onConfirm={(value) => {
                    setShowSortDialog(false);
                    handleRestart(value);
                }}
            />
        </>
    );
}
