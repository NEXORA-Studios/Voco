import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Play, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardFooter } from "@workspace/shadcn-ui/components/card";
import { Badge } from "@workspace/shadcn-ui/components/badge";
import { usePackagesStore } from "@/store/packages.store";
import { useSessionStore } from "@/store/session.store";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SelectDialog } from "@/components/SelectDialog";
import type { Package } from "@/types/global.d.ts";

interface Props {
    pkg: Package;
}

export function PackageCard({ pkg }: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { deletePackage, resetPackageSort } = usePackagesStore();
    const { pkg: sessionPkg, state: sessionState } = useSessionStore();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showModeDialog, setShowModeDialog] = useState(false);
    const [showSortDialog, setShowSortDialog] = useState(false);

    const hasActiveSession = sessionPkg?.slug === pkg.slug && sessionState.status !== "done" && sessionState.status !== "idle";

    const handleStart = () => {
        setShowModeDialog(true);
    };

    const handleModeConfirm = (mode: string) => {
        navigate(`/session/${pkg.slug || pkg.id}?mode=${mode}`);
    };

    const handleDelete = async () => {
        await deletePackage(pkg.slug);
        setShowDeleteConfirm(false);
    };

    const handleSortChange = (method: string) => {
        resetPackageSort(pkg.slug, method as "shuffle" | "alphabetical" | "original");
        setShowSortDialog(false);
    };

    const modeOptions = [
        { value: "both", label: t("session.mode.both") },
        { value: "original_only", label: t("session.mode.original_only") },
        { value: "translation_only", label: t("session.mode.translation_only") },
    ];

    const sortOptions = [
        { value: "shuffle", label: t("packages.sort_shuffle") },
        { value: "alphabetical", label: t("packages.sort_alphabetical") },
        { value: "original", label: t("packages.sort_original") },
    ];

    return (
        <>
            <Card className="flex flex-col">
                <CardContent className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{pkg.name}</h3>
                        <div className="flex gap-1">
                            {!pkg.slug && <Badge variant="destructive">Invalid ID</Badge>}
                            <Badge variant="secondary">{t(`packages.sort_${pkg.sort_method}`)}</Badge>
                        </div>
                    </div>
                    {pkg.description && <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                        {pkg.entries.length} {t("packages.entries")}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-wrap items-end gap-2">
                    <Button size="sm" onClick={handleStart} disabled={!pkg.slug}>
                        <Play className="mr-1 h-3 w-3" />
                        {hasActiveSession ? t("session.continue") : t("packages.start")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/packages/${pkg.slug || pkg.id}/edit`)}>
                        <Pencil className="mr-1 h-3 w-3" />
                        {t("packages.edit")}
                    </Button>
                    <Button size="sm" variant="outline" disabled={!pkg.slug} onClick={() => setShowSortDialog(true)}>
                        <RotateCcw className="mr-1 h-3 w-3" />
                        {t("packages.reset")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={!pkg.slug}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        {t("packages.delete")}
                    </Button>
                </CardFooter>
            </Card>

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                title={t("packages.delete")}
                description={t("packages.confirmDelete")}
                confirmLabel={t("packages.delete")}
                cancelLabel={t("packages.form.cancel")}
                confirmVariant="destructive"
                onConfirm={handleDelete}
            />

            <SelectDialog
                open={showModeDialog}
                onOpenChange={setShowModeDialog}
                title={t("session.selectMode")}
                description={t("session.title")}
                options={modeOptions}
                confirmLabel={t("session.start")}
                cancelLabel={t("packages.form.cancel")}
                onConfirm={(value) => {
                    setShowModeDialog(false);
                    handleModeConfirm(value);
                }}
            />

            <SelectDialog
                open={showSortDialog}
                onOpenChange={setShowSortDialog}
                title={t("packages.sort")}
                description={t("packages.form.sortMethod")}
                options={sortOptions}
                defaultValue={pkg.sort_method}
                confirmLabel={t("packages.reset")}
                cancelLabel={t("packages.form.cancel")}
                onConfirm={(value) => {
                    handleSortChange(value);
                }}
            />
        </>
    );
}
