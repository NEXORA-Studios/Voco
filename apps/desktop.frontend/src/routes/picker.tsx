import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { usePickerStore } from "@/store/picker.store";
import { PresetList } from "@/features/picker/components/PresetList";
import { PickerDisplay } from "@/features/picker/components/PickerDisplay";

export function Picker() {
    useTranslation();
    const { loaded, load } = usePickerStore();

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    return (
        <div className="flex h-full min-h-0 flex-col gap-6 overflow-auto p-6 lg:flex-row lg:overflow-hidden">
            <div className="w-full shrink-0 lg:min-h-0 lg:w-80 lg:overflow-auto">
                <PresetList />
            </div>
            <div className="min-h-80 min-w-0 flex-1 lg:min-h-0">
                <PickerDisplay />
            </div>
        </div>
    );
}
