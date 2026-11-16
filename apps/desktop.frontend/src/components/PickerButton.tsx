import { Bridge } from "@/lib/bridge";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@workspace/shadcn-ui/components/tooltip";
import { useTranslation } from "react-i18next";
import { Dices } from "lucide-react";

export function PickerButton() {
    const { t } = useTranslation();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    size="icon"
                    aria-label={t("picker.title", "Picker")}
                    className="fixed right-6 bottom-6 z-30 h-14 w-14 cursor-pointer rounded-full shadow-lg"
                    onClick={async () => {
                        try {
                            await Bridge.window.openPicker();
                        } catch (error) {
                            console.error("Failed to open picker window:", error);
                        }
                    }}>
                    <Dices className="size-7" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{t("picker.title", "Picker")}</TooltipContent>
        </Tooltip>
    );
}
