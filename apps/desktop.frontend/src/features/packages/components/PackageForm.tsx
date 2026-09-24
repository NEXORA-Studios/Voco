import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Textarea } from "@workspace/shadcn-ui/components/textarea";
import { Label } from "@workspace/shadcn-ui/components/label";
import { SortMethodSelect } from "./SortMethodSelect";
import { usePackagesStore } from "@/store/packages.store";
import type { Package, SortMethod } from "@/types/global.d.ts";

interface Props { initialPackage?: Package; onSaved: () => void; mode: "create" | "edit" }
function slugify(name: string) {
    const slug = name.trim().replace(/[\s_]+/g, "-").replace(/[\\/:*?"<>|]+/g, "");
    return slug || `pkg-${Math.random().toString(36).slice(2, 8)}`;
}
export function PackageForm({ initialPackage, onSaved, mode }: Props) {
    const { t } = useTranslation();
    const { updatePackage } = usePackagesStore();
    const [name, setName] = useState(initialPackage?.name ?? "");
    const [slug] = useState(initialPackage?.slug ?? "");
    const [description, setDescription] = useState(initialPackage?.description ?? "");
    const [tagsText, setTagsText] = useState(initialPackage?.tags.join(", ") ?? "");
    const [sortMethod, setSortMethod] = useState<SortMethod>(initialPackage?.sort_method ?? "shuffle");
    const handleSave = async () => {
        if (!name.trim() || !slug.trim()) return;
        const now = new Date().toISOString();
        const pkg: Package = {
            ...(initialPackage ?? { format: "voco-package", format_version: 1, id: uuidv4(), slug: slugify(name), entries: [], source_language: "und", target_language: "und", tags: [], sort_order: {}, files: { rawdata: "rawdata.toml", data: "data.toml", images: "images" }, created: { at: now, by: "voco" }, updated: { at: now }, legacy_data_version: undefined }),
            slug: slug.trim(), name: name.trim(), description: description.trim(), sort_method: sortMethod,
            tags: [...new Set(tagsText.split(",").map((tag) => tag.trim()).filter(Boolean))], updated: { at: now },
        };
        if (mode === "edit") await updatePackage(pkg);
        onSaved();
    };
    return <div className="flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex flex-col gap-2"><Label>{t("packages.form.bundle", { defaultValue: "Tags" })}</Label><Input placeholder="grade-7, animals" value={tagsText} onChange={(e) => setTagsText(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>{t("packages.form.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>{t("packages.form.description")}</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label>{t("packages.form.sortMethod")}</Label><SortMethodSelect value={sortMethod} onChange={setSortMethod} /></div>
        <Button onClick={handleSave}>{t("packages.form.save")}</Button>
    </div>;
}
