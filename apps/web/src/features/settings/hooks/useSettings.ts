import { useSettingsStore } from "@/store/settings.store";

export function useSettings() {
    return useSettingsStore();
}
