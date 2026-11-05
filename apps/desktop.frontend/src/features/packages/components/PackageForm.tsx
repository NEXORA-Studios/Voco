import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Textarea } from "@workspace/shadcn-ui/components/textarea";
import { Label } from "@workspace/shadcn-ui/components/label";
import { toast } from "@workspace/shadcn-ui/components/sonner";
import { SortMethodSelect } from "./SortMethodSelect";
import { BundleSelect, EMPTY_BUNDLE_VALUE, NEW_BUNDLE_VALUE } from "./BundleSelect";
import { usePackagesStore } from "@/store/packages.store";
import { useSettingsStore } from "@/store/settings.store";
import type { Package, SortMethod } from "@/types/global.d.ts";

interface Props {
    initialPackage?: Package;
    onSaved: () => void;
    mode: "create" | "edit";
}
function slugify(name: string) {
    const slug = name
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[\\/:*?"<>|]+/g, "");
    return slug || `pkg-${Math.random().toString(36).slice(2, 8)}`;
}
export function PackageForm({ initialPackage, onSaved, mode }: Props) {
    const { t } = useTranslation();
    const { updatePackage } = usePackagesStore();
    const settings = useSettingsStore((state) => state.settings);
    const createBundle = useSettingsStore((state) => state.createBundle);
    const [name, setName] = useState(initialPackage?.name ?? "");
    const [slug] = useState(initialPackage?.slug ?? "");
    const [description, setDescription] = useState(initialPackage?.description ?? "");
    const [bundleId, setBundleId] = useState(initialPackage?.tags[0] ?? (mode === "edit" ? EMPTY_BUNDLE_VALUE : ""));
    const [newBundleName, setNewBundleName] = useState("");
    const [sortMethod, setSortMethod] = useState<SortMethod>(initialPackage?.sort_method ?? "shuffle");
    const saveInitialized = useRef(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSave = async () => {
        if (!name.trim() || !slug.trim() || bundleId === NEW_BUNDLE_VALUE) return;
        const now = new Date().toISOString();
        const selectedBundleId = bundleId === EMPTY_BUNDLE_VALUE ? "" : bundleId;
        const pkg: Package = {
            ...(initialPackage ?? {
                format: "voco-package",
                format_version: 1,
                id: uuidv4(),
                slug: slugify(name),
                entries: [],
                source_language: "und",
                target_language: "und",
                tags: [],
                sort_order: {},
                files: { data: "data.toml", images: "images" },
                created: { at: now, by: "voco" },
                updated: { at: now },
                legacy_data_version: undefined,
            }),
            slug: slug.trim(),
            name: name.trim(),
            description: description.trim(),
            sort_method: sortMethod,
            tags: selectedBundleId ? [selectedBundleId] : [],
            sort_order: selectedBundleId ? { [selectedBundleId]: initialPackage?.sort_order[selectedBundleId] ?? 10 } : {},
            updated: { at: now },
        };
        if (mode === "edit") {
            await updatePackage(pkg);
            toast.success(t("packages.form.autoSaved"));
        }
        if (mode === "create") onSaved();
    };

    useEffect(() => {
        if (mode !== "edit") return;
        if (!saveInitialized.current) {
            saveInitialized.current = true;
            return;
        }
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            void handleSave().catch((error) => toast.error(String(error)));
        }, 400);
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [bundleId, description, mode, name, sortMethod, newBundleName]);

    useEffect(
        () => () => {
            if (saveTimer.current) clearTimeout(saveTimer.current);
        },
        []
    );

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.bundle")}</Label>
                <BundleSelect
                    value={bundleId}
                    onValueChange={setBundleId}
                    settings={settings}
                    extraIds={initialPackage?.tags}
                    newName={newBundleName}
                    onNewNameChange={setNewBundleName}
                    onNewBundleConfirm={createBundle}
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.description")}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.sortMethod")}</Label>
                <SortMethodSelect value={sortMethod} onChange={setSortMethod} />
            </div>
            {mode === "create" && <Button onClick={handleSave}>{t("packages.form.save")}</Button>}
        </div>
    );
}
