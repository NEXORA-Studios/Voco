import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/shadcn-ui/components/dialog";
import { Bridge } from "@/lib/bridge";
import { useSessionStore } from "@/store/session.store";

export function VocabCard() {
    const { pkg, state, mode, display, setDisplay, imageDialogOpen, setImageDialogOpen } = useSessionStore();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const entry = state.status === "paused" || state.status === "revealed" ? state.entry : null;

    useEffect(() => {
        setImageDialogOpen(false);
    }, [entry?.id, mode]);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;
        setImageUrl(null);
        if (!entry?.image || !pkg || !display.image) return;

        const extension = entry.image.split(".").pop()?.toLowerCase();
        const mimeType = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : `image/${extension}`;
        Bridge.packages
            .readImage(pkg.slug, entry.id)
            .then((bytes) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: mimeType }));
                setImageUrl(objectUrl);
                if (display.image_method === "dialog") {
                    setImageDialogOpen(true);
                }
            })
            .catch(() => setImageUrl(null));

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [entry?.id, entry?.image, pkg?.slug, display.image, display.image_method]);

    if (!entry || !entry.source?.word || !entry.translation?.word) return null;
    const imageOnRight = display.image_method === "right";
    const imageInDialog = display.image && display.image_method === "dialog";
    const primary = mode === "translation_only" ? entry.translation : entry.source;
    const alternative = mode === "translation_only" ? entry.source : entry.translation;
    const primaryVisible = mode !== "both" || display.original;
    const primaryDescriptionEnabled =
        mode === "translation_only" ? display.translation_description : display.original_description;
    const primaryDescriptionFollowsWord =
        mode === "translation_only" ? display.translation_description_follows_word : display.original_description_follows_word;
    const primaryDescriptionVisible = primaryDescriptionEnabled && (!primaryDescriptionFollowsWord || primaryVisible);
    const alternativeDescriptionEnabled =
        mode === "translation_only" ? display.original_description : display.translation_description;
    const alternativeDescriptionFollowsWord =
        mode === "translation_only" ? display.original_description_follows_word : display.translation_description_follows_word;
    const alternativeVisible =
        mode === "both" ? display.translation : mode === "translation_only" ? display.original : display.translation;
    const alternativeDescriptionVisible =
        alternativeDescriptionEnabled && (!alternativeDescriptionFollowsWord || alternativeVisible);
    const alternativeHasDivider = primaryVisible && alternativeVisible;

    return (
        <div
            className={`grid w-full gap-8 px-2 ${
                imageUrl && imageOnRight
                    ? "max-w-7xl grid-cols-1 items-center text-center lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-x-16 lg:gap-y-10 lg:text-left"
                    : "max-w-6xl grid-cols-1 justify-items-center text-center"
            }`}>
            <div
                className={`flex w-full flex-col gap-5 ${imageUrl && imageOnRight ? "items-center lg:items-start" : "items-center"}`}>
                <div
                    className={`flex w-full flex-col gap-3 ${imageUrl && imageOnRight ? "items-center lg:items-start" : "items-center"}`}>
                    {primaryVisible && (
                        <div className="max-w-full font-mono text-6xl leading-tight font-bold break-words sm:text-7xl lg:text-8xl">
                            {primary.word}
                        </div>
                    )}
                    {primaryVisible && primary.description && primaryDescriptionVisible && (
                        <p className="max-w-3xl text-lg break-words whitespace-pre-wrap text-muted-foreground sm:text-xl">
                            {primary.description}
                        </p>
                    )}
                    {alternativeVisible && (
                        <div
                            className={`flex w-full flex-col gap-2 ${alternativeHasDivider ? "mt-2 border-t pt-4" : ""} ${imageUrl && imageOnRight ? "items-center lg:items-start" : "items-center"}`}>
                            <div className="max-w-full font-mono text-4xl leading-snug font-semibold break-words sm:text-5xl">
                                {alternative.word}
                            </div>
                            {alternative.description && alternativeDescriptionVisible && (
                                <p className="max-w-3xl text-lg break-words whitespace-pre-wrap text-muted-foreground sm:text-xl">
                                    {alternative.description}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {imageUrl && imageOnRight && (
                <div className="flex w-full items-center justify-center lg:justify-end">
                    <img
                        src={imageUrl}
                        alt={entry.source.word}
                        className="max-h-[55svh] max-w-full rounded-md border object-contain"
                    />
                </div>
            )}
            {imageUrl && imageInDialog && (
                <Dialog
                    open={imageDialogOpen}
                    onOpenChange={(open) => {
                        setImageDialogOpen(open);
                        if (!open) setDisplay({ image: false });
                    }}>
                    <DialogContent className="max-h-[96svh] w-[96vw] overflow-auto sm:max-w-7xl">
                        <DialogHeader>
                            <DialogTitle>{entry.source.word}</DialogTitle>
                        </DialogHeader>
                        <img src={imageUrl} alt={entry.source.word} className="max-h-[84svh] w-full object-contain" />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
