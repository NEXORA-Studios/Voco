import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@workspace/shadcn-ui/components/sonner";
import { Check } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Input } from "@workspace/shadcn-ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/shadcn-ui/components/select";
import type { Settings } from "@/types/global.d.ts";
import { usePackagesStore } from "@/store/packages.store";

export const NEW_BUNDLE_VALUE = "__new_bundle__";
export const EMPTY_BUNDLE_VALUE = "__uncategorized__";

interface Props {
    value: string;
    onValueChange: (value: string) => void;
    settings: Settings | null;
    extraIds?: string[];
    newName: string;
    onNewNameChange: (value: string) => void;
    onNewBundleConfirm: (name: string) => Promise<string | null>;
}

export function BundleSelect({
    value,
    onValueChange,
    settings,
    extraIds = [],
    newName,
    onNewNameChange,
    onNewBundleConfirm,
}: Props) {
    const { t } = useTranslation();
    const packages = usePackagesStore((state) => state.packages);
    const [confirming, setConfirming] = useState(false);
    const referencedIds = useMemo(() => packages.flatMap((pkg) => pkg.tags), [packages]);
    const options = useMemo(() => {
        const ids = [...new Set([...Object.keys(settings?.tags ?? {}), ...referencedIds, ...extraIds].filter(Boolean))];
        return ids
            .map((id) => ({
                id,
                name: settings?.tags[id]?.name ?? id,
                order: settings?.tags[id]?.order ?? Number.MAX_SAFE_INTEGER,
            }))
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    }, [extraIds, referencedIds, settings?.tags]);

    const confirmNewBundle = async () => {
        const name = newName.trim();
        if (!name || confirming) return;
        setConfirming(true);
        try {
            const id = await onNewBundleConfirm(name);
            if (id) {
                onValueChange(id);
                onNewNameChange("");
            }
        } catch (error) {
            toast.error(String(error));
        } finally {
            setConfirming(false);
        }
    };

    return (
        <>
            <Select
                value={value || undefined}
                onValueChange={(selected) => {
                    onValueChange(selected);
                    if (selected !== NEW_BUNDLE_VALUE) onNewNameChange("");
                }}>
                <SelectTrigger>
                    <SelectValue placeholder={t("packages.form.selectBundle")} />
                </SelectTrigger>
                <SelectContent position="popper">
                    <SelectItem value={EMPTY_BUNDLE_VALUE}>{t("packages.form.uncategorized")}</SelectItem>
                    {options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                            {option.name}
                        </SelectItem>
                    ))}
                    <SelectItem value={NEW_BUNDLE_VALUE}>{t("packages.form.newBundle")}</SelectItem>
                </SelectContent>
            </Select>
            {value === NEW_BUNDLE_VALUE && (
                <div className="flex gap-2">
                    <Input
                        autoFocus
                        aria-label={t("packages.form.bundleName")}
                        placeholder={t("packages.form.bundleName")}
                        value={newName}
                        onChange={(event) => onNewNameChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                void confirmNewBundle();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        size="icon"
                        aria-label={t("packages.form.confirmBundleName")}
                        title={t("packages.form.confirmBundleName")}
                        disabled={!newName.trim() || confirming}
                        onClick={() => void confirmNewBundle()}>
                        <Check className="size-4" />
                    </Button>
                </div>
            )}
        </>
    );
}
