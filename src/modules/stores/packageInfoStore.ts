import { defineStore } from "pinia";
import { ref } from "vue";
import { TauriFsJsonAdapter } from "../tauri/fs";
import { PackageInfo } from "../../types/packageInfo";

export const usePackageInfoStore = defineStore("packageInfo", () => {
    const packageInfo = ref<PackageInfo[]>([]);
    const flattenPackageInfo = ref<Record<string, Record<string, PackageInfo>>>({});

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
        update,
    };
});
