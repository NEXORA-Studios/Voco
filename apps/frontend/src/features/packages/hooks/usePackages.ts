import { usePackagesStore } from "@/store/packages.store";

export function usePackages() {
    return usePackagesStore();
}
