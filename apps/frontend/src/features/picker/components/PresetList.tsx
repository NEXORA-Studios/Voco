import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Play } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/shadcn-ui/components/card";
import { usePickerStore } from "@/store/picker.store";
import { PresetForm } from "./PresetForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function PresetList() {
    const { t } = useTranslation();
    const { presets, loadPreset, deletePreset } = usePickerStore();
    const [showForm, setShowForm] = useState(false);
    const [editPreset, setEditPreset] = useState<(typeof presets)[0] | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!deleteId) return;
        await deletePreset(deleteId);
        setDeleteId(null);
    };

    const presetToDelete = presets.find((p) => p.id === deleteId);

    return (
        <>
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t("picker.title")}</CardTitle>
                    <Button
                        size="sm"
                        onClick={() => {
                            setEditPreset(null);
                            setShowForm(true);
                        }}>
                        <Plus className="mr-1 h-4 w-4" />
                        {t("picker.newPreset")}
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {showForm && <PresetForm preset={editPreset ?? undefined} onClose={() => setShowForm(false)} />}

                    <div className="flex flex-col gap-2">
                        {presets.map((preset) => (
                            <div key={preset.id} className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-medium">{preset.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {preset.items.length} items ·{" "}
                                        {preset.items.reduce((sum, i) => sum + i.picks_per_reset, 0)} picks
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => loadPreset(preset)}>
                                        <Play className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setEditPreset(preset);
                                            setShowForm(true);
                                        }}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() => setDeleteId(preset.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title={presetToDelete?.name ?? t("picker.title")}
                description={t("picker.confirmDelete")}
                confirmLabel={t("packages.delete")}
                cancelLabel={t("packages.form.cancel")}
                confirmVariant="destructive"
                onConfirm={handleDelete}
            />
        </>
    );
}
