import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import { PackageForm } from "@/features/packages/components/PackageForm";
import { usePackagesStore } from "@/store/packages.store";
import { useExcelImport } from "@/features/packages/hooks/useExcelImport";
import { ExcelSheetPicker } from "@/features/packages/components/ExcelSheetPicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import type { Package, VocabEntry } from "@/types/global.d.ts";

export function PackageEdit() {
    const { slug } = useParams<{ slug: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { packages, loaded, load, updatePackage } = usePackagesStore();
    const [pkg, setPkg] = useState<Package | null>(null);
    const [importMode, setImportMode] = useState<"append" | "replace" | null>(null);
    const excel = useExcelImport();

    // Inline editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editOriginal, setEditOriginal] = useState("");
    const [editTranslation, setEditTranslation] = useState("");

    // Confirm dialogs
    const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
    const [showCleanAllConfirm, setShowCleanAllConfirm] = useState(false);

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    useEffect(() => {
        if (slug && loaded) {
            const found = packages.find((p) => p.slug === slug || p.id === slug);
            if (found) setPkg(found);
        }
    }, [slug, packages, loaded]);

    const startEdit = (entry: VocabEntry) => {
        setEditingId(entry.id);
        setEditOriginal(entry.original);
        setEditTranslation(entry.translation);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditOriginal("");
        setEditTranslation("");
    };

    const handleUpdateEntry = async () => {
        if (!pkg || !editingId) return;
        const entries = pkg.entries.map((e) =>
            e.id === editingId ? { ...e, original: editOriginal, translation: editTranslation } : e
        );
        const updated: Package = { ...pkg, entries, updated_at: new Date().toISOString() };
        await updatePackage(updated);
        setPkg(updated);
        cancelEdit();
    };

    const handleDeleteEntry = async () => {
        if (!pkg || !deleteEntryId) return;
        const entries = pkg.entries.filter((e) => e.id !== deleteEntryId);
        const updated: Package = { ...pkg, entries, updated_at: new Date().toISOString() };
        await updatePackage(updated);
        setPkg(updated);
        setDeleteEntryId(null);
    };

    const handleImport = async () => {
        if (!pkg) return;
        const newEntries: VocabEntry[] = excel.mappedEntries.map((e) => ({
            id: uuidv4(),
            original: e.original,
            translation: e.translation,
        }));

        const entries = importMode === "append" ? [...pkg.entries, ...newEntries] : newEntries;
        const updated: Package = { ...pkg, entries, updated_at: new Date().toISOString() };
        await updatePackage(updated);
        setPkg(updated);
        setImportMode(null);
        excel.reset();
    };

    const handleCleanAll = async () => {
        if (!pkg) return;
        const updated: Package = { ...pkg, entries: [], updated_at: new Date().toISOString() };
        await updatePackage(updated);
        setPkg(updated);
        setShowCleanAllConfirm(false);
    };

    const handleCancelImport = () => {
        setImportMode(null);
        excel.reset();
    };

    if (!pkg) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{t("packages.edit")}</h1>
            </div>

            <PackageForm initialPackage={pkg} onSaved={() => navigate("/")} mode="edit" />

            {/* Entries Section */}
            <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {t("packages.editor.entriesTitle")} ({pkg.entries.length})
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setImportMode("append")}>
                            {t("packages.editor.import")}
                        </Button>
                        <Button variant="outline" onClick={() => setImportMode("replace")}>
                            {t("packages.editor.reimport")}
                        </Button>
                        <Button variant="destructive" onClick={() => setShowCleanAllConfirm(true)}>
                            {t("packages.editor.cleanAll")}
                        </Button>
                    </div>
                </div>

                {pkg.entries.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">{t("packages.editor.noEntries")}</p>
                ) : (
                    <div className="mt-4 max-h-96 overflow-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="sticky top-0 z-10 border-b bg-muted">
                                    <th className="w-12 px-3 py-2 text-left font-medium">#</th>
                                    <th className="px-3 py-2 text-left font-medium">{t("packages.import.originalCol")}</th>
                                    <th className="px-3 py-2 text-left font-medium">{t("packages.import.translationCol")}</th>
                                    <th className="w-24 px-3 py-2 text-right font-medium">{t("packages.edit")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pkg.entries.map((entry, i) => (
                                    <tr key={entry.id} className="border-b last:border-b-0">
                                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                                        {editingId === entry.id ? (
                                            <>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={editOriginal}
                                                        onChange={(e) => setEditOriginal(e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        value={editTranslation}
                                                        onChange={(e) => setEditTranslation(e.target.value)}
                                                        className="h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={handleUpdateEntry}>
                                                            <Check className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={cancelEdit}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-3 py-2">{entry.original}</td>
                                                <td className="px-3 py-2">{entry.translation}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => startEdit(entry)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                            onClick={() => setDeleteEntryId(entry.id)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Import UI */}
                {importMode && (
                    <div className="mt-4 rounded-md border p-4">
                        <h3 className="font-medium">
                            {importMode === "append" ? t("packages.editor.import") : t("packages.editor.reimport")}
                        </h3>
                        {!excel.workbook ? (
                            <Button className="mt-2" onClick={excel.loadFile}>
                                {t("packages.import.chooseFile")}
                            </Button>
                        ) : (
                            <div className="mt-4 flex flex-col gap-4">
                                {excel.workbook.SheetNames.length > 1 && (
                                    <ExcelSheetPicker
                                        sheets={excel.workbook.SheetNames}
                                        value={excel.sheetName}
                                        onChange={excel.selectSheet}
                                    />
                                )}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="hasHeader"
                                        checked={excel.hasHeader}
                                        onChange={(e) => excel.setHasHeader(e.target.checked)}
                                    />
                                    <label htmlFor="hasHeader">{t("packages.import.hasHeader")}</label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label>{t("packages.import.originalCol")}</label>
                                        <Select
                                            value={String(excel.originalCol)}
                                            onValueChange={(v) => excel.setOriginalCol(Number(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                {excel.headers.map((h, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label>{t("packages.import.translationCol")}</label>
                                        <Select
                                            value={String(excel.translationCol)}
                                            onValueChange={(v) => excel.setTranslationCol(Number(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent position="popper">
                                                {excel.headers.map((h, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {h}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t("packages.import.totalEntries", { count: excel.mappedEntries.length })}
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={handleCancelImport}>
                                        {t("packages.editor.cancel")}
                                    </Button>
                                    <Button onClick={handleImport} disabled={excel.mappedEntries.length === 0}>
                                        {importMode === "append"
                                            ? t("packages.editor.confirmImport")
                                            : t("packages.editor.confirmReimport")}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteEntryId}
                onOpenChange={(open) => !open && setDeleteEntryId(null)}
                title={t("packages.delete")}
                description={t("packages.confirmDelete")}
                confirmLabel={t("packages.delete")}
                cancelLabel={t("packages.form.cancel")}
                confirmVariant="destructive"
                onConfirm={handleDeleteEntry}
            />

            <ConfirmDialog
                open={showCleanAllConfirm}
                onOpenChange={setShowCleanAllConfirm}
                title={t("packages.editor.cleanAll")}
                description={t("packages.editor.confirmCleanAll")}
                confirmLabel={t("packages.editor.cleanAll")}
                cancelLabel={t("packages.form.cancel")}
                confirmVariant="destructive"
                onConfirm={handleCleanAll}
            />
        </div>
    );
}
