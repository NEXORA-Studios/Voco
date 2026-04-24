import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Textarea } from "@workspace/shadcn-ui/components/textarea";
import { Label } from "@workspace/shadcn-ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import { SortMethodSelect } from "./SortMethodSelect";
import { usePackagesStore } from "@/store/packages.store";
import type { Package, SortMethod } from "@/types/global.d.ts";

interface Props {
    initialPackage?: Package;
    onSaved: () => void;
    mode: "create" | "edit";
}

function slugify(name: string) {
    let slug = name
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[\\/:*?"<>|]+/g, "");
    if (!slug) {
        slug = "pkg-" + Math.random().toString(36).slice(2, 8);
    }
    return slug;
}

export function PackageForm({ initialPackage, onSaved, mode }: Props) {
    const { t } = useTranslation();
    const { bundles, updatePackage } = usePackagesStore();

    const [name, setName] = useState(initialPackage?.name ?? "");
    const [slug, setSlug] = useState(initialPackage?.slug ?? "");
    const [description, setDescription] = useState(initialPackage?.description ?? "");
    const [bundleSlug, setBundleSlug] = useState(initialPackage?.bundle_slug ?? "");
    const [newBundleName, setNewBundleName] = useState("");
    const [sortMethod, setSortMethod] = useState<SortMethod>(initialPackage?.sort_method ?? "shuffle");

    const handleSave = async () => {
        if (!name.trim() || !slug.trim()) return;

        let finalBundleSlug = bundleSlug;
        if (finalBundleSlug === "__new__") {
            finalBundleSlug = slugify(newBundleName);
        }

        const pkg: Package = {
            ...(initialPackage ?? {
                version: 1,
                id: uuidv4(),
                slug: slugify(name),
                entries: [],
                created_at: new Date().toISOString(),
            }),
            bundle_slug: finalBundleSlug,
            slug: slug.trim(),
            name: name.trim(),
            description: description.trim(),
            sort_method: sortMethod,
            updated_at: new Date().toISOString(),
        };

        if (mode === "edit") {
            await updatePackage(pkg);
            onSaved();
        } else {
            // For create, caller will handle
            onSaved();
        }
    };

    return (
        <div className="flex flex-col gap-4 rounded-lg border p-4">
            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.bundle")}</Label>
                <Select value={bundleSlug} onValueChange={(v) => setBundleSlug(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder={t("packages.form.selectBundle")} />
                    </SelectTrigger>
                    <SelectContent position="popper">
                        {bundles.map((b) => (
                            <SelectItem key={b.slug} value={b.slug}>
                                {b.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="__new__">{t("packages.form.newBundle")}</SelectItem>
                    </SelectContent>
                </Select>
                {bundleSlug === "__new__" && (
                    <Input
                        placeholder={t("packages.form.bundleName")}
                        value={newBundleName}
                        onChange={(e) => setNewBundleName(e.target.value)}
                    />
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.description")}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
                <Label>{t("packages.form.sortMethod")}</Label>
                <SortMethodSelect value={sortMethod} onChange={setSortMethod} />
            </div>

            <Button onClick={handleSave}>{t("packages.form.save")}</Button>
        </div>
    );
}
