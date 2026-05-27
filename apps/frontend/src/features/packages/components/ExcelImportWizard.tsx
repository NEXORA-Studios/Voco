import { useState, useRef, useCallback } from "react";
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
import { cn } from "@workspace/shadcn-ui/lib/utils";
import { Check, Upload, FileSpreadsheet } from "lucide-react";

function slugify(/* name: string */) {
    return "pkg-" + Math.random().toString(36).slice(2, 8);
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
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // 渲染表格单元格，处理合并单元格
    const renderTableCell = (cell: unknown, rowIdx: number, colIdx: number) => {
        const mergeSpan = excel.getMergeSpan(rowIdx, colIdx);

        // 如果被合并了（不是主单元格），不渲染
        if (mergeSpan && mergeSpan.rowspan === 0 && mergeSpan.colspan === 0) {
            return null;
        }

        const parsedSource = String(cell ?? "");
        const isCellEmpty = parsedSource.length === 0;
        const isHeaderRow = rowIdx === excel.headerRowIndex;
        const isMerged = mergeSpan && (mergeSpan.rowspan > 1 || mergeSpan.colspan > 1);

        const cellClass = cn(
            "border-r px-2 py-1 last:border-r-0",
            isCellEmpty && "opacity-50",
            isHeaderRow && "bg-muted font-medium",
            isMerged && "text-center"
        );

        const content = isCellEmpty ? "(empty)" : parsedSource;

        if (mergeSpan) {
            return (
                <td
                    key={colIdx}
                    className={cellClass}
                    rowSpan={mergeSpan.rowspan > 1 ? mergeSpan.rowspan : undefined}
                    colSpan={mergeSpan.colspan > 1 ? mergeSpan.colspan : undefined}>
                    {content}
                </td>
            );
        }

        return (
            <td key={colIdx} className={cellClass}>
                {content}
            </td>
        );
    };

    // 获取所有表头行选项（包括"从头开始"）
    const allHeaderOptions = [
        {
            index: -1,
            label: t("packages.import.noHeader") || "从头开始",
            preview: t("packages.import.noHeaderDesc") || "从第 1 行开始读取数据（合并单元格会被忽略）",
        },
        ...excel.headerRowOptions,
    ];

    // 获取列选择选项（使用 Excel 列标记 A/B/C）
    const columnOptions = excel.columnLetters.map((letter, index) => ({
        value: index,
        label: letter,
    }));

    // 处理拖放事件
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 只有当离开整个区域时才取消拖拽状态
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = e.dataTransfer.files;
            if (files.length === 0) return;

            const file = files[0];
            // 检查文件类型
            const validExtensions = [".xlsx", ".xls"];
            const fileName = file.name.toLowerCase();
            const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

            if (!isValid) {
                // 可以在这里添加错误提示
                console.warn("Invalid file type. Please upload an Excel file.");
                return;
            }

            // 读取文件并解析
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            excel.loadFromBytes(bytes, file.name);
        },
        [excel]
    );

    // 处理点击选择文件
    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            excel.loadFromBytes(bytes, file.name);

            // 重置 input 以便可以再次选择同一文件
            e.target.value = "";
        },
        [excel]
    );

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
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">{t("packages.import.title")}</h2>

                    {!excel.workbook ? (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                            <div
                                onClick={handleClick}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative flex min-h-[400px] cursor-pointer flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed p-12 transition-all duration-200",
                                    isDragging
                                        ? "scale-[1.02] border-primary bg-primary/5"
                                        : "border-muted-foreground/25 bg-muted/50 hover:border-muted-foreground/50 hover:bg-muted"
                                )}>
                                <div
                                    className={cn(
                                        "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200",
                                        isDragging
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-background text-muted-foreground"
                                    )}>
                                    {isDragging ? <Upload className="h-10 w-10" /> : <FileSpreadsheet className="h-10 w-10" />}
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-medium">
                                        {isDragging
                                            ? t("packages.import.dropHere") || "松开以导入文件"
                                            : t("packages.import.dragDropTitle") || "拖放 Excel 文件到此处"}
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {t("packages.import.dragDropDesc") || "或将文件拖放到此区域，或点击选择文件"}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/60">
                                        {t("packages.import.supportedFormats") || "支持 .xlsx, .xls 格式"}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClick();
                                    }}>
                                    {t("packages.import.chooseFile") || "选择文件"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            {excel.workbook.SheetNames.length > 1 && (
                                <ExcelSheetPicker
                                    sheets={excel.workbook.SheetNames}
                                    value={excel.sheetName}
                                    onChange={excel.selectSheet}
                                />
                            )}

                            {/* 表头行选择 - 始终显示，包括"无表头"选项 */}
                            <div className="flex flex-col gap-2">
                                <Label>{t("packages.import.headerRow")}</Label>
                                <div className="flex flex-wrap gap-2">
                                    {allHeaderOptions.map((option) => (
                                        <button
                                            key={option.index}
                                            type="button"
                                            onClick={() => excel.updateHeaderRowIndex(option.index)}
                                            className={cn(
                                                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                                                excel.headerRowIndex === option.index
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-background hover:bg-muted"
                                            )}>
                                            <span className="font-medium">
                                                {option.index === -1 ? option.label : `${option.label}（${option.preview}）`}
                                            </span>
                                            {excel.headerRowIndex === option.index && <Check className="h-4 w-4" />}
                                        </button>
                                    ))}
                                    {/* 自定义行号选项 */}
                                    <button
                                        type="button"
                                        onClick={() => excel.updateHeaderRowIndex(-2)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                                            excel.headerRowIndex === -2 ||
                                                (excel.headerRowIndex >= 0 &&
                                                    !allHeaderOptions.some((o) => o.index === excel.headerRowIndex))
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background hover:bg-muted"
                                        )}>
                                        <span className="font-medium">{t("packages.import.customRow") || "自定义行"}</span>
                                        {(excel.headerRowIndex === -2 ||
                                            (excel.headerRowIndex >= 0 &&
                                                !allHeaderOptions.some((o) => o.index === excel.headerRowIndex))) && (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {/* 自定义行号输入框 */}
                                {(excel.headerRowIndex === -2 ||
                                    (excel.headerRowIndex >= 0 &&
                                        !allHeaderOptions.some((o) => o.index === excel.headerRowIndex))) && (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            placeholder={t("packages.import.customRowPlaceholder") || "输入行号（如：10）"}
                                            value={excel.customRowInput}
                                            onChange={(e) => excel.updateCustomRowInput(e.target.value)}
                                            className="w-60"
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            {t("packages.import.customRowHint") || "从该行开始读取数据"}
                                        </span>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">{t("packages.import.headerRowHint")}</p>
                            </div>

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
                                            {columnOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={String(opt.value)} disabled={opt.value === excel.translationCol}>
                                                    {opt.label}
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
                                            {columnOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={String(opt.value)} disabled={opt.value === excel.originalCol}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {excel.sheetData.length > 0 && (
                                <div className="overflow-auto rounded-md border">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="w-8 border-r px-2 py-1 text-left text-xs text-muted-foreground">
                                                    #
                                                </th>
                                                {excel.columnLetters.map((letter) => (
                                                    <th
                                                        key={letter}
                                                        className="border-r px-2 py-1 text-left text-xs text-muted-foreground last:border-r-0">
                                                        {letter}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {excel.sheetData.slice(0, 10).map((row, ri) => {
                                                const isHeaderRow = ri === excel.headerRowIndex;
                                                return (
                                                    <tr key={ri} className={cn("border-b", isHeaderRow && "bg-muted")}>
                                                        <td
                                                            className={cn(
                                                                "border-r px-2 py-1 text-xs text-muted-foreground",
                                                                isHeaderRow && "font-medium text-primary"
                                                            )}>
                                                            {ri + 1}
                                                        </td>
                                                        {excel.columnLetters.map((_, ci) => {
                                                            const cell = row?.[ci];
                                                            return renderTableCell(cell, ri, ci);
                                                        })}
                                                    </tr>
                                                );
                                            })}
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
