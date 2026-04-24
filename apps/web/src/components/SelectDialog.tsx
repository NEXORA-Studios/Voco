import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@workspace/shadcn-ui/components/dialog";
import { Button } from "@workspace/shadcn-ui/components/button";
import { RadioGroup, RadioGroupItem } from "@workspace/shadcn-ui/components/radio-group";
import { Label } from "@workspace/shadcn-ui/components/label";
import { useEffect, useState } from "react";

interface Option {
    value: string;
    label: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    options: Option[];
    defaultValue?: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: (value: string) => void;
}

export function SelectDialog({
    open,
    onOpenChange,
    title,
    description,
    options,
    defaultValue,
    confirmLabel,
    cancelLabel,
    onConfirm,
}: Props) {
    const [selected, setSelected] = useState<string>(defaultValue ?? options[0]?.value ?? "");

    useEffect(() => {
        if (open) {
            setSelected(defaultValue ?? options[0]?.value ?? "");
        }
    }, [open, defaultValue, options]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <RadioGroup value={selected} onValueChange={setSelected} className="gap-3">
                    {options.map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value} id={opt.value} />
                            <Label htmlFor={opt.value} className="cursor-pointer">
                                {opt.label}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {cancelLabel}
                    </Button>
                    <Button onClick={() => onConfirm(selected)}>{confirmLabel}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
