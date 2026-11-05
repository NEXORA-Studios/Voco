import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "@workspace/shadcn-ui/components/sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { usePackagesStore } from "@/store/packages.store";
import { useSettingsStore } from "@/store/settings.store";

type TagRow = { id: string; name: string; order: number };

export function TagsSettings() {
    const { t } = useTranslation();
    const settings = useSettingsStore((state) => state.settings);
    const setTags = useSettingsStore((state) => state.setTags);
    const createBundle = useSettingsStore((state) => state.createBundle);
    const packages = usePackagesStore((state) => state.packages);
    const packagesLoaded = usePackagesStore((state) => state.loaded);
    const packagesError = usePackagesStore((state) => state.error);
    const loadPackages = usePackagesStore((state) => state.load);
    const updatePackage = usePackagesStore((state) => state.updatePackage);
    const [rows, setRows] = useState<TagRow[]>([]);
    const [newTagName, setNewTagName] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const newTagInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tagIds = useMemo(() => {
        const ids = Object.keys(settings?.tags ?? {});
        const used = packages.flatMap((pkg) => pkg.tags);
        return [...new Set([...ids, ...used])].sort((a, b) => {
            const aOrder = settings?.tags[a]?.order ?? Number.MAX_SAFE_INTEGER;
            const bOrder = settings?.tags[b]?.order ?? Number.MAX_SAFE_INTEGER;
            return aOrder - bOrder || a.localeCompare(b);
        });
    }, [packages, settings?.tags]);

    useEffect(() => {
        if (!packagesLoaded) void loadPackages();
    }, [packagesLoaded, loadPackages]);

    useEffect(() => {
        if (!settings) return;
        setRows(
            tagIds.map((id, index) => ({
                id,
                name: settings.tags[id]?.name ?? id,
                order: settings.tags[id]?.order ?? index,
            }))
        );
    }, [settings, tagIds]);

    useEffect(() => {
        if (newTagName !== null) newTagInputRef.current?.focus();
    }, [newTagName]);

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        []
    );

    const persistRows = async (nextRows: TagRow[]) => {
        if (!settings) return;
        await setTags(
            Object.fromEntries(
                nextRows.map(({ id, name }, index) => [
                    id,
                    {
                        name: name.trim() || id,
                        ...(settings.tags[id]?.color ? { color: settings.tags[id].color } : {}),
                        order: index,
                    },
                ])
            )
        );
    };

    const saveRows = async (nextRows: TagRow[]) => {
        if (!settings) return;
        setSaving(true);
        setSaveError(null);
        try {
            await persistRows(nextRows);
            toast.success(t("settings.tagsSaved"));
        } catch (error) {
            setSaveError(String(error));
            toast.error(t("settings.tagsSaveError"));
        } finally {
            setSaving(false);
        }
    };

    const scheduleSave = (nextRows: TagRow[]) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => void saveRows(nextRows), 600);
    };

    const updateRow = (id: string, value: string) => {
        if (rows.some((row) => row.id !== id && row.name.trim() === value.trim())) {
            toast.error(t("settings.tagAlreadyExists"));
            return;
        }
        const nextRows = rows.map((row) => (row.id === id ? { ...row, name: value } : row));
        setRows(nextRows);
        scheduleSave(nextRows);
    };

    const moveRow = (id: string, direction: -1 | 1) => {
        const index = rows.findIndex((row) => row.id === id);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= rows.length) return;
        const nextRows = [...rows];
        [nextRows[index], nextRows[targetIndex]] = [nextRows[targetIndex], nextRows[index]];
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setRows(nextRows);
        void saveRows(nextRows);
    };

    const deleteRow = async (id: string) => {
        if (!packagesLoaded || packagesError) return;
        const nextRows = rows.filter((row) => row.id !== id);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSaving(true);
        setSaveError(null);
        try {
            const now = new Date().toISOString();
            await Promise.all(
                packages
                    .filter((pkg) => pkg.tags.includes(id))
                    .map((pkg) =>
                        updatePackage({
                            ...pkg,
                            tags: pkg.tags.filter((tagId) => tagId !== id),
                            sort_order: Object.fromEntries(Object.entries(pkg.sort_order).filter(([tagId]) => tagId !== id)),
                            updated: { at: now },
                        })
                    )
            );
            await persistRows(nextRows);
            setRows(nextRows);
            toast.success(t("settings.tagsSaved"));
        } catch (error) {
            setSaveError(String(error));
            toast.error(t("settings.tagsSaveError"));
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        if (newTagName === null) setNewTagName("");
    };

    const finishNewTag = async () => {
        if (newTagName === null) return;
        const name = newTagName.trim();
        setNewTagName(null);
        if (!name) return;
        if (rows.some((row) => row.name.trim() === name)) {
            toast.error(t("settings.tagAlreadyExists"));
            return;
        }
        try {
            const id = await createBundle(name);
            if (!id) throw new Error(t("settings.tagsSaveError"));
            toast.success(t("settings.tagsSaved"));
        } catch (error) {
            setSaveError(String(error));
            toast.error(t("settings.tagsSaveError"));
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{t("settings.tags")}</h2>
                    {saving && <span className="text-xs text-muted-foreground">{t("settings.saving")}</span>}
                </div>
                <Button type="button" variant="outline" onClick={addTag} disabled={newTagName !== null}>
                    {t("settings.addTag")}
                </Button>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {rows.length === 0 && newTagName === null ? (
                <p className="text-sm text-muted-foreground">{t("settings.noTags")}</p>
            ) : (
                <div className="divide-y rounded-md border">
                    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground">
                        <span aria-hidden="true" />
                        <span>{t("settings.tagName")}</span>
                        <span aria-hidden="true" />
                    </div>
                    {newTagName !== null && (
                        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-3 px-3 py-2">
                            <span aria-hidden="true" />
                            <Input
                                ref={newTagInputRef}
                                autoFocus
                                aria-label={t("settings.newTagName")}
                                placeholder={t("settings.newTagName")}
                                value={newTagName}
                                onChange={(event) => setNewTagName(event.target.value)}
                                onBlur={finishNewTag}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") event.currentTarget.blur();
                                    if (event.key === "Escape") setNewTagName(null);
                                }}
                            />
                            <span aria-hidden="true" />
                        </div>
                    )}
                    {rows.map((row, index) => (
                        <div key={row.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2rem] items-center gap-3 px-3 py-2">
                            <div className="flex items-center gap-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("settings.moveTagUp")}
                                    title={t("settings.moveTagUp")}
                                    disabled={index === 0 || saving}
                                    onClick={() => moveRow(row.id, -1)}>
                                    <ArrowUp className="size-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t("settings.moveTagDown")}
                                    title={t("settings.moveTagDown")}
                                    disabled={index === rows.length - 1 || saving}
                                    onClick={() => moveRow(row.id, 1)}>
                                    <ArrowDown className="size-4" />
                                </Button>
                            </div>
                            <Input
                                aria-label={`${t("settings.tagName")} ${row.name}`}
                                value={row.name}
                                onChange={(event) => updateRow(row.id, event.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={t("settings.deleteTag")}
                                title={t("settings.deleteTag")}
                                disabled={saving || !packagesLoaded || Boolean(packagesError)}
                                onClick={() => deleteRow(row.id)}>
                                <Trash2 className="size-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
