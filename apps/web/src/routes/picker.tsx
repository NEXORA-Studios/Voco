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
        <div className="flex h-full flex-col gap-6 lg:flex-row">
            <div className="w-full lg:w-80">
                <PresetList />
            </div>
            <div className="flex-1">
                <PickerDisplay />
            </div>
        </div>
    );
}
