import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@workspace/shadcn-ui/components/sonner";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Textarea } from "@workspace/shadcn-ui/components/textarea";
import { Label } from "@workspace/shadcn-ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import { useNavigate } from "react-router-dom";
import { useExcelImport } from "@/features/packages/hooks/useExcelImport";
import { ExcelSheetPicker } from "./ExcelSheetPicker";
import { ExcelWorksheetPreview } from "./ExcelWorksheetPreview";
import { SortMethodSelect } from "./SortMethodSelect";
import { BundleSelect, EMPTY_BUNDLE_VALUE, NEW_BUNDLE_VALUE } from "./BundleSelect";
import { usePackagesStore } from "@/store/packages.store";
import { useSettingsStore } from "@/store/settings.store";
import type { Package, SortMethod, VocabEntry } from "@/types/global.d.ts";
import { cn } from "@workspace/shadcn-ui/lib/utils";
import { Check, Upload, FileSpreadsheet, ImagePlus, LoaderCircle, Eye } from "lucide-react";
import { Bridge, bytesToBase64 } from "@/lib/bridge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/shadcn-ui/components/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@workspace/shadcn-ui/components/dialog";

function slugify(name: string) {
    return (
        name
            .trim()
            .replace(/[\s_]+/g, "-")
            .replace(/[^A-Za-z0-9._-]/g, "") || `pkg-${Math.random().toString(36).slice(2, 8)}`
    );
}

interface ImportImage {
    id: string;
    name: string;
    row?: number;
    mimeType: string;
    dataBase64: string;
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function imagePreview(image: ImportImage) {
    return `data:${image.mimeType};base64,${image.dataBase64}`;
}

export function ExcelImportWizard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { createPackage } = usePackagesStore();
    const settings = useSettingsStore((state) => state.settings);
    const createBundle = useSettingsStore((state) => state.createBundle);
    const excel = useExcelImport();

    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [bundleId, setBundleId] = useState("");
    const [newBundleName, setNewBundleName] = useState("");
    const [sortMethod, setSortMethod] = useState<SortMethod>("shuffle");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageAssets, setImageAssets] = useState<ImportImage[]>([]);
    const [imageAssignments, setImageAssignments] = useState<Record<number, string>>({});
    const imageFilesRef = useRef<HTMLInputElement>(null);
    const imageFolderRef = useRef<HTMLInputElement>(null);
    const [isExtractingImages, setIsExtractingImages] = useState(false);
    const [imageAnchorCol, setImageAnchorCol] = useState(-1);
    useEffect(() => {
        setImageAssets([]);
        setImageAssignments({});
    }, [excel.workbookBytes, excel.sheetName]);
    const setImageAssignment = (row: number, imageId: string) => {
        setImageAssignments((current) => {
            const next = { ...current };
            if (imageId) next[row] = imageId;
            else delete next[row];
            return next;
        });
    };

    const extractWorkbookImages = async () => {
        if (!excel.workbookBytes) return;
        setIsExtractingImages(true);
        try {
            const workbookBase64 = await bytesToBase64(excel.workbookBytes);
            const images = await Bridge.fs.extractImages(workbookBase64, excel.sheetName, imageAnchorCol);
            const assets = images.map((image) => ({
                id: image.id,
                name: image.name,
                row: image.row,
                mimeType: image.mime_type,
                dataBase64: image.data_base64,
            }));
            setImageAssets(assets);
            setImageAssignments(Object.fromEntries(assets.filter((image) => image.row).map((image) => [image.row!, image.id])));
        } catch (error) {
            toast.error(String(error));
        } finally {
            setIsExtractingImages(false);
        }
    };

    const loadImageFiles = async (files: FileList | null) => {
        if (!files) return;
        const selected = Array.from(files).filter((file) => /^image\/(png|jpeg|gif|webp|bmp)$/.test(file.type));
        const assets = await Promise.all(
            selected.map(async (file, index) => ({
                id: `file-${index}-${file.name}-${file.lastModified}`,
                name: file.webkitRelativePath || file.name,
                mimeType: file.type,
                dataBase64: await fileToBase64(file),
            }))
        );
        const byName = new Map(
            assets.map((image) => [
                image.name
                    .split("/")
                    .pop()!
                    .replace(/\.[^.]+$/, "")
                    .toLowerCase(),
                image.id,
            ])
        );
        setImageAssets(assets);
        setImageAssignments(
            Object.fromEntries(
                excel.mappedEntries.flatMap((entry) => {
                    const rowMatch = assets.find((image) => {
                        const stem = image.name
                            .split("/")
                            .pop()!
                            .replace(/\.[^.]+$/, "");
                        return /^\d+$/.test(stem) && Number(stem) === entry.sourceRow;
                    });
                    const match =
                        rowMatch?.id ?? byName.get(entry.original.toLowerCase()) ?? byName.get(entry.translation.toLowerCase());
                    return match ? [[entry.sourceRow, match]] : [];
                })
            )
        );
    };

    const handleSave = async () => {
        if (!name.trim() || !slug.trim() || excel.mappedEntries.length === 0) return;
        if (bundleId === NEW_BUNDLE_VALUE) {
            toast.error(t("packages.form.confirmBundleName"));
            return;
        }
        const selectedBundleId = bundleId === EMPTY_BUNDLE_VALUE ? "" : bundleId;
        const now = new Date().toISOString();
        const entries: VocabEntry[] = excel.mappedEntries.map((e, index) => ({
            id: uuidv4(),
            original_index: index + 1,
            runtime_index: index + 1,
            source: { word: e.original, description: e.originalDescription },
            translation: { word: e.translation, description: e.translationDescription },
            ...(imageAssignments[e.sourceRow] && imageAssets.find((image) => image.id === imageAssignments[e.sourceRow])
                ? (() => {
                      const image = imageAssets.find((candidate) => candidate.id === imageAssignments[e.sourceRow])!;
                      return { image_data: image.dataBase64, image_name: image.name };
                  })()
                : e.imageSource
                  ? { image_source: e.imageSource }
                  : {}),
        }));
        const pkg: Package = {
            format: "voco-package",
            format_version: 1,
            id: uuidv4(),
            slug: slugify(slug),
            name: name.trim(),
            description: description.trim(),
            source_language: "und",
            target_language: "und",
            tags: selectedBundleId ? [selectedBundleId] : [],
            sort_order: {},
            files: { data: "data.toml", images: "images" },
            created: { at: now, by: "voco" },
            updated: { at: now },
            sort_method: sortMethod,
            entries,
        };
        await createPackage(pkg);
        navigate("/");
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
    const optionalColumnOptions = [{ value: -1, label: t("packages.import.noColumn") }, ...columnOptions];

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
                        <BundleSelect
                            value={bundleId}
                            onValueChange={setBundleId}
                            settings={settings}
                            newName={newBundleName}
                            onNewNameChange={setNewBundleName}
                            onNewBundleConfirm={createBundle}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>{t("packages.form.name")}</Label>
                        <Input
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (!slug || step === 1) setSlug(slugify(e.target.value));
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
                    <Button onClick={() => setStep(2)} disabled={!name.trim() || !slug.trim()}>
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

                            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                                <div className="flex flex-col gap-2 xl:order-1">
                                    <Label className="flex gap-0.5">
                                        {t("packages.import.originalCol")}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={String(excel.originalCol)}
                                        onValueChange={(v) => excel.assignColumn("original", Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {optionalColumnOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={String(opt.value)}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2 xl:order-2">
                                    <Label className="flex gap-0.5">
                                        {t("packages.import.translationCol")}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={String(excel.translationCol)}
                                        onValueChange={(v) => excel.assignColumn("translation", Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {optionalColumnOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={String(opt.value)}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2 xl:order-3">
                                    <Label className="flex gap-0.5">
                                        {t("packages.import.originalDescriptionCol")}
                                        <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={String(excel.originalDescriptionCol)}
                                        onValueChange={(v) => excel.assignColumn("originalDescription", Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {optionalColumnOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={String(opt.value)}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2 xl:order-4">
                                    <Label>{t("packages.import.translationDescriptionCol")}</Label>
                                    <Select
                                        value={String(excel.translationDescriptionCol)}
                                        onValueChange={(v) => excel.assignColumn("translationDescription", Number(v))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper">
                                            {optionalColumnOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={String(opt.value)}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {excel.sheetData.length > 0 && (
                                <ExcelWorksheetPreview
                                    columnLetters={excel.columnLetters}
                                    data={excel.sheetData}
                                    headerRowIndex={excel.headerRowIndex}
                                    getMergeSpan={excel.getMergeSpan}
                                />
                            )}

                            <div className="rounded-md bg-muted p-3">
                                <p className="text-sm font-medium">{t("packages.import.preview")}</p>
                                <div className="mt-2 flex flex-col gap-1">
                                    {excel.mappedEntries.slice(0, 5).map((e, i) => {
                                        function truncateText(text: string, maxLength: number): string {
                                            if (text.length <= maxLength) return text;
                                            return text.slice(0, maxLength) + "...";
                                        }
                                        return (
                                            <div key={i} className="flex gap-1 text-xs">
                                                {e.original} → {e.translation}
                                                {e.originalDescription && (
                                                    <span className="text-muted-foreground">
                                                        ({truncateText(e.originalDescription, 40)})
                                                    </span>
                                                )}
                                                {e.translationDescription && (
                                                    <span className="text-muted-foreground">
                                                        ({truncateText(e.translationDescription, 40)})
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
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
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold">{t("packages.import.imagesTitle")}</h2>
                    <input
                        ref={imageFilesRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            void loadImageFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />
                    <input
                        ref={imageFolderRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        {...({ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                        onChange={(event) => {
                            void loadImageFiles(event.target.files);
                            event.target.value = "";
                        }}
                    />
                    <div className="grid gap-4 lg:grid-cols-2">
                        <section className="flex flex-col gap-3 rounded-md border p-4">
                            <div>
                                <h3 className="font-medium">{t("packages.import.excelImageSource")}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t("packages.import.excelImageSourceHint")}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex flex-col gap-2">
                                    <Label>{t("packages.import.imageAnchorCol")}</Label>
                                    <Select
                                        value={String(imageAnchorCol)}
                                        onValueChange={(value) => setImageAnchorCol(Number(value))}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent position="popper" className="w-32! min-w-0!">
                                            {columnOptions.map((option) => (
                                                <SelectItem key={option.value} value={String(option.value)} className="w-32!">
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="outline"
                                    disabled={!excel.workbookBytes || isExtractingImages || imageAnchorCol < 0}
                                    onClick={() => void extractWorkbookImages()}>
                                    {isExtractingImages ? (
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <ImagePlus className="mr-2 h-4 w-4" />
                                    )}
                                    {isExtractingImages
                                        ? t("packages.import.extractingImages")
                                        : t("packages.import.extractImages")}
                                </Button>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" disabled={excel.sheetData.length === 0}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            {t("packages.import.excelPreviewButton")}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-6xl!">
                                        <DialogHeader>
                                            <DialogTitle>
                                                {t("packages.import.excelPreview", { sheet: excel.sheetName })}
                                            </DialogTitle>
                                            <DialogDescription>{t("packages.import.excelPreviewHint")}</DialogDescription>
                                        </DialogHeader>
                                        <div className="max-h-[70vh] overflow-auto">
                                            <ExcelWorksheetPreview
                                                columnLetters={excel.columnLetters}
                                                data={excel.sheetData}
                                                headerRowIndex={excel.headerRowIndex}
                                                getMergeSpan={excel.getMergeSpan}
                                                highlightColumn={imageAnchorCol}
                                                maxRows={20}
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </section>
                        <section className="flex flex-col gap-3 rounded-md border p-4">
                            <div>
                                <h3 className="font-medium">{t("packages.import.manualImageSource")}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t("packages.import.manualImageSourceHint")}
                                </p>
                            </div>
                            <div className="mt-auto flex flex-wrap gap-2">
                                <Button variant="outline" onClick={() => imageFilesRef.current?.click()}>
                                    <ImagePlus className="mr-2 h-4 w-4" />
                                    {t("packages.import.chooseImages")}
                                </Button>
                                <Button variant="outline" onClick={() => imageFolderRef.current?.click()}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    {t("packages.import.chooseImageFolder")}
                                </Button>
                            </div>
                        </section>
                    </div>
                    {imageAssets.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {t("packages.import.imageCount", { count: imageAssets.length })}
                        </p>
                    )}
                    <div className="max-h-[420px] overflow-auto rounded-md border">
                        <table className="w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-muted">
                                <tr className="border-b">
                                    <th className="px-3 py-2 text-left">{t("packages.import.entry")}</th>
                                    <th className="px-3 py-2 text-left">{t("packages.import.image")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {excel.mappedEntries.map((entry) => {
                                    const selected = imageAssets.find(
                                        (image) => image.id === imageAssignments[entry.sourceRow]
                                    );
                                    return (
                                        <tr key={entry.sourceRow} className="border-b last:border-0">
                                            <td className="px-3 py-2">
                                                <span className="text-muted-foreground">{entry.sourceRow}</span> ·{" "}
                                                {entry.original} → {entry.translation}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={imageAssignments[entry.sourceRow] ?? "none"}
                                                        onValueChange={(value) =>
                                                            setImageAssignment(entry.sourceRow, value === "none" ? "" : value)
                                                        }>
                                                        <SelectTrigger className="min-w-48">
                                                            <SelectValue placeholder={t("packages.import.noImage")} />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper">
                                                            <SelectItem value="none">{t("packages.import.noImage")}</SelectItem>
                                                            {imageAssets.map((image) => (
                                                                <SelectItem key={image.id} value={image.id}>
                                                                    {image.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {selected && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <img
                                                                    src={imagePreview(selected)}
                                                                    alt={selected.name}
                                                                    className="h-10 w-10 rounded border object-contain"
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent
                                                                side="left"
                                                                className="border bg-background p-2 text-foreground">
                                                                <img
                                                                    src={imagePreview(selected)}
                                                                    alt={selected.name}
                                                                    className="max-h-64 max-w-64 object-contain"
                                                                />
                                                                <span className="sr-only">{selected.name}</span>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep(2)}>
                            {t("packages.form.back")}
                        </Button>
                        <Button onClick={() => setStep(4)}>{t("packages.form.next")}</Button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <h2 className="text-lg font-semibold">{t("packages.form.confirm")}</h2>
                    <p>{t("packages.import.totalEntries", { count: excel.mappedEntries.length })}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setStep(3)}>
                            {t("packages.form.back")}
                        </Button>
                        <Button onClick={handleSave}>{t("packages.form.save")}</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
