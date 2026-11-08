import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@workspace/shadcn-ui/components/button";
import { useSessionStore } from "@/store/session.store";
import { usePackagesStore } from "@/store/packages.store";
import { SelectDialog } from "@/components/SelectDialog";
import { SessionDisplayControls } from "@/features/session/components/SessionDisplayControls";
import { Kbd } from "@workspace/shadcn-ui/components/kbd";
import { Separator } from "@workspace/shadcn-ui/components/separator";

export function SessionControls() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pkg, state, remaining, spin, next, reset } = useSessionStore();
    const { resetPackageSort } = usePackagesStore();

    const [showSortDialog, setShowSortDialog] = useState(false);

    const total = pkg?.entries.length ?? 0;
    const current = remaining.length;

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
            const target = event.target;
            if (
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            )
                return;

            const session = useSessionStore.getState();
            const key = event.key.toLowerCase();
            if (session.imageDialogOpen) {
                if (key === "m") {
                    event.preventDefault();
                    session.setImageDialogOpen(false);
                    session.setDisplay({ image: false });
                }
                if (event.code === "Space" || ["c", "v", "b", "n"].includes(key)) {
                    return;
                }
                if (key === "m") return;
            }

            if (["c", "v", "b", "n", "m"].includes(key)) {
                if (session.state.status === "done") return;
                event.preventDefault();
                const field = (
                    {
                        c: "original",
                        v: "original_description",
                        b: "translation",
                        n: "translation_description",
                        m: "image",
                    } as const
                )[key as "c" | "v" | "b" | "n" | "m"];
                if (field === "original" && session.mode === "original_only") return;
                if (field === "translation" && session.mode === "translation_only") return;
                session.setDisplay({ [field]: !session.display[field] });
                return;
            }

            if (event.code !== "Space") return;
            if (session.state.status === "spinning" || session.state.status === "done") return;
            event.preventDefault();
            if (session.state.status === "idle") session.spin();
            else if (session.state.status === "paused" || session.state.status === "revealed") session.next();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

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
                <div className="pointer-events-auto flex w-full max-w-4xl flex-col items-center gap-3 rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur-sm">
                    {state.status !== "done" && (
                        <>
                            <SessionDisplayControls />
                            <Separator />
                        </>
                    )}

                    {(state.status === "idle" ||
                        state.status === "spinning" ||
                        state.status === "paused" ||
                        state.status === "revealed") && (
                        <div className="flex w-full items-center gap-4">
                            <Button
                                size="lg"
                                variant="default"
                                className="min-w-0 flex-1"
                                disabled={state.status === "spinning"}
                                onClick={() => {
                                    if (state.status === "idle") spin();
                                    else if (state.status === "paused" || state.status === "revealed") next();
                                }}>
                                <span className="truncate">
                                    {state.status === "idle"
                                        ? t("session.start")
                                        : state.status === "spinning"
                                          ? t("session.spinning")
                                          : t("session.next")}
                                </span>
                                <Kbd className="ml-2 rounded border border-current/20 px-1.5 py-0.5 font-mono text-xs">
                                    Space
                                </Kbd>
                            </Button>
                            <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                                {current}/{total} {t("packages.entries")}
                            </p>
                        </div>
                    )}

                    {state.status === "done" && (
                        <div className="flex w-full gap-2">
                            <Button className="flex-1" onClick={() => setShowSortDialog(true)}>
                                {t("session.restart")}
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
                                {t("session.back")}
                            </Button>
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
