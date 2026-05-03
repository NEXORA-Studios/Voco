import { useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Textarea } from "@workspace/shadcn-ui/components/textarea";
import { Label } from "@workspace/shadcn-ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import { useNavigate } from "react-router-dom";
import { useExcelImport } from "@/features/packages/hooks/useExcelImport";
import { ExcelSheetPicker } from "./ExcelSheetPicker";
import { SortMethodSelect } from "./SortMethodSelect";
import { usePackagesStore } from "@/store/packages.store";
import type { Package, BundleMeta, SortMethod, VocabEntry } from "@/types/global.d.ts";

function slugify(/* name: string */) {
    return "pkg-" + Math.random().toString(36).slice(2, 8);
    // let slug = name
    //     .trim()
    //     .replace(/[\s_]+/g, "-")
    //     .replace(/[\\/:*?"<>|]+/g, "");
    // if (!slug) {
    //     slug = "pkg-" + Math.random().toString(36).slice(2, 8);
    // }
    // return slug;
}

export function ExcelImportWizard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { bundles, createPackage } = usePackagesStore();
    const excel = useExcelImport();

    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [bundleSlug, setBundleSlug] = useState("");
    const [newBundleName, setNewBundleName] = useState("");
    const [sortMethod, setSortMethod] = useState<SortMethod>("shuffle");

    const handleSave = async () => {
        if (!name.trim() || !slug.trim() || excel.mappedEntries.length === 0) return;

        const finalSlug = slug.trim();
        let finalBundleSlug = bundleSlug;
        let bundle: BundleMeta | null = null;

        if (finalBundleSlug === "__new__") {
            const bslug = slugify(/* newBundleName */);
            bundle = {
                version: 1,
                id: uuidv4(),
                slug: bslug,
                name: newBundleName,
                package_slugs: [finalSlug],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            finalBundleSlug = bslug;
        } else {
            const existing = bundles.find((b) => b.slug === finalBundleSlug);
            if (existing) {
                bundle = {
                    ...existing,
                    package_slugs: [...existing.package_slugs, slug],
                    updated_at: new Date().toISOString(),
                };
            }
        }

        if (!bundle) return;

        const entries: VocabEntry[] = excel.mappedEntries.map((e) => ({
            id: uuidv4(),
            original: e.original,
            translation: e.translation,
        }));

        const pkg: Package = {
            version: 1,
            id: uuidv4(),
            bundle_slug: finalBundleSlug,
            slug: finalSlug,
            name: name.trim(),
            description: description.trim(),
            sort_method: sortMethod,
            entries,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await createPackage(pkg, bundle);
        navigate("/");
    };

    return (
        <div className="flex flex-col gap-6">
            {step === 1 && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">{t("packages.form.step1")}</h2>
                    <div className="flex flex-col gap-2">
                        <Label>{t("packages.form.bundle")}</Label>
                        <Select value={bundleSlug} onValueChange={(v) => setBundleSlug(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="--" />
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
                        <Input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!slug || step === 1) setSlug(slugify(/* e.target.value */));
                            }}
                        />
                    </div>
                    {/* <div className="flex flex-col gap-2">
                        <Label>Slug</Label>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name)} />
                    </div> */}
                    <div className="flex flex-col gap-2">
                        <Label>{t("packages.form.description")}</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>{t("packages.form.sortMethod")}</Label>
                        <SortMethodSelect value={sortMethod} onChange={setSortMethod} />
                    </div>
                    <Button
                        onClick={() => setStep(2)}
                        disabled={!name.trim() || !bundleSlug || (bundleSlug === "__new__" && !newBundleName.trim())}>
                        {t("packages.form.next")}
                    </Button>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">{t("packages.import.title")}</h2>

                    {!excel.workbook ? (
                        <Button onClick={excel.loadFile}>{t("packages.import.chooseFile")}</Button>
                    ) : (
                        <>
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
                                <Label htmlFor="hasHeader">{t("packages.import.hasHeader")}</Label>
                            </div>

                            {excel.hasHeader && (
                                <div className="flex flex-col gap-2">
                                    <Label>{t("packages.import.headerRow")}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={excel.headerRow}
                                        onChange={(e) => excel.updateHeaderRow(Number(e.target.value))}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label>{t("packages.import.originalCol")}</Label>
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
                                    <Label>{t("packages.import.translationCol")}</Label>
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

                            {excel.sheetData.length > 0 && (
                                <div className="overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                {excel.headers.map((h, i) => (
                                                    <th key={i} className="px-2 py-1 text-left">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {excel.sheetData.slice(0, 8).map((row, ri) => (
                                                <tr key={ri} className="border-b">
                                                    {row.map((cell, ci) => (
                                                        <td key={ci} className="px-2 py-1">
                                                            {String(cell ?? "")}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="rounded-md bg-muted p-3">
                                <p className="text-sm font-medium">{t("packages.import.preview")}</p>
                                <div className="mt-2 flex flex-col gap-1">
                                    {excel.mappedEntries.slice(0, 5).map((e, i) => (
                                        <div key={i} className="text-xs">
                                            {e.original} → {e.translation}
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {t("packages.import.totalEntries", { count: excel.mappedEntries.length })}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    {t("packages.form.back")}
                                </Button>
                                <Button onClick={() => setStep(3)} disabled={excel.mappedEntries.length === 0}>
                                    {t("packages.form.next")}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">{t("packages.form.confirm")}</h2>
                    <p>{t("packages.import.totalEntries", { count: excel.mappedEntries.length })}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep(2)}>
                            {t("packages.form.back")}
                        </Button>
                        <Button onClick={handleSave}>{t("packages.form.save")}</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
