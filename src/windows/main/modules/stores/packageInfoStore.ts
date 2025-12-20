import { defineStore } from "pinia";
import { ref } from "vue";
import { TauriFs, TauriFsJsonAdapter } from "@wM/modules/tauri/fs";
import { PackageInfo } from "@s/types/packageInfo";

export const usePackageInfoStore = defineStore("packageInfo", () => {
    const packageInfo = ref<PackageInfo[]>([]);
    const flattenPackageInfo = ref<Record<string, Record<string, PackageInfo>>>({});

    async function initialize() {
        if (!(await TauriFs.exists("data.json"))) {
            await TauriFs.createFile("data.json");
        }
        try {
            const data = await TauriFsJsonAdapter.readJsonFile<{ packages: any[]; version: number }>("data.json");
            if (typeof data["packages"] !== "object") throw new Error();
            if (typeof data["version"] !== "number") throw new Error();
        } catch {
            await TauriFs.copyFile("data.json", "data.json.bak");
            await TauriFs.remove("data.json");
            await TauriFsJsonAdapter.writeJsonFile("data.json", {
                version: 1,
                packages: [],
            });
        }

        await usePackageInfoStore().update();
    }

    async function update() {
        const data = await TauriFsJsonAdapter.readJsonFile<{ packages: PackageInfo[] }>("data.json");
        packageInfo.value = data["packages"];

        const flat: Record<string, Record<string, PackageInfo>> = {};

        for (const item of packageInfo.value) {
            const [bundle, sub] = item.name.split("#");

            if (!flat[bundle]) {
                flat[bundle] = {};
            }
            flat[bundle][sub] = item;
        }

        flattenPackageInfo.value = flat;
    }

    return {
        packageInfo,
        flattenPackageInfo,
        initialize,
        update,
    };
});
