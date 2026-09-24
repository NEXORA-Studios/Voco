import { create } from "zustand";
import { Bridge } from "@/lib/bridge";
import { sortEntries, normalizeSortMethod } from "@/lib/sort";
import { useSessionStore } from "@/store/session.store";
import type { Package } from "@/types/global.d.ts";

interface PackagesState {
    packages: Package[];
    loaded: boolean;
    error: string | null;
    load: () => Promise<void>;
    createPackage: (pkg: Package) => Promise<void>;
    updatePackage: (pkg: Package) => Promise<void>;
    deletePackage: (slug: string) => Promise<void>;
    resetPackageSort: (slug: string, method: Package["sort_method"]) => Promise<void>;
}
export const usePackagesStore = create<PackagesState>((set, get) => ({
    packages: [], loaded: false, error: null,
    async load() {
        try {
            const packages = (await Bridge.packages.list()).map((pkg) => ({
                ...pkg,
                sort_method: normalizeSortMethod(pkg.sort_method),
            }));
            set({ packages, loaded: true, error: null });
        } catch (error) {
            set({ loaded: true, error: String(error) });
        }
    },
    async createPackage(pkg) { await Bridge.packages.write(pkg); await get().load(); },
    async updatePackage(pkg) {
        await Bridge.packages.write(pkg);
        set((state) => ({ packages: state.packages.map((p) => p.id === pkg.id ? pkg : p) }));
    },
    async deletePackage(slug) { await Bridge.packages.delete(slug); await get().load(); },
    async resetPackageSort(slug, method) {
        const pkg = get().packages.find((p) => p.slug === slug);
        if (!pkg) return;
        const normalizedMethod = normalizeSortMethod(method);
        const updated = { ...pkg, entries: sortEntries(pkg.entries, normalizedMethod), sort_method: normalizedMethod };
        await Bridge.packages.write(updated);
        set((state) => ({ packages: state.packages.map((p) => p.slug === slug ? updated : p) }));
        const sessionPkg = useSessionStore.getState().pkg;
        if (sessionPkg?.slug === slug || sessionPkg?.id === pkg.id) useSessionStore.getState().reset();
    },
}));
