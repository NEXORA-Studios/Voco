import { create } from "zustand";
import { Bridge } from "@/lib/bridge";
import { sortEntries } from "@/lib/sort";
import { useSessionStore } from "@/store/session.store";
import type { BundleMeta, Package } from "@/types/global.d.ts";

interface PackagesState {
    bundles: BundleMeta[];
    packages: Package[];
    loaded: boolean;
    load: () => Promise<void>;
    createPackage: (pkg: Package, bundle: BundleMeta) => Promise<void>;
    updatePackage: (pkg: Package) => Promise<void>;
    deletePackage: (slug: string) => Promise<void>;
    resetPackageSort: (slug: string, method: Package["sort_method"]) => Promise<void>;
}

export const usePackagesStore = create<PackagesState>((set, get) => ({
    bundles: [],
    packages: [],
    loaded: false,

    async load() {
        const [bundles, packages] = await Promise.all([Bridge.bundles.list(), Bridge.packages.list()]);
        set({ bundles, packages, loaded: true });
    },

    async createPackage(pkg, bundle) {
        await Bridge.packages.write(pkg);
        await Bridge.bundles.write(bundle);
        await get().load();
    },

    async updatePackage(pkg) {
        await Bridge.packages.write(pkg);
        set((state) => ({
            packages: state.packages.map((p) => (p.id === pkg.id ? pkg : p)),
        }));
    },

    async deletePackage(slug) {
        const pkg = get().packages.find((p) => p.slug === slug);
        if (!pkg) return;
        await Bridge.packages.delete(slug);

        const bundle = get().bundles.find((b) => b.slug === pkg.bundle_slug);
        if (bundle) {
            const updated: BundleMeta = {
                ...bundle,
                package_slugs: bundle.package_slugs.filter((s) => s !== slug),
            };
            if (updated.package_slugs.length === 0) {
                await Bridge.bundles.delete(bundle.slug);
            } else {
                await Bridge.bundles.write(updated);
            }
        }
        await get().load();
    },

    async resetPackageSort(slug, method) {
        const pkg = get().packages.find((p) => p.slug === slug);
        if (!pkg) return;
        const entries = sortEntries(pkg.entries, method);
        const updated: Package = { ...pkg, entries, sort_method: method };
        await Bridge.packages.write(updated);
        set((state) => ({
            packages: state.packages.map((p) => (p.slug === slug ? updated : p)),
        }));
        // Clear session if it's for this package
        const sessionPkg = useSessionStore.getState().pkg;
        if (sessionPkg?.slug === slug || sessionPkg?.id === pkg.id) {
            useSessionStore.getState().reset();
        }
    },
}));
