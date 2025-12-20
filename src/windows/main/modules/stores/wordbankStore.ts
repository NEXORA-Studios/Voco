import { ref } from "vue";
import { defineStore } from "pinia";
import { TauriFsJsonAdapter } from "@wM/modules/tauri/fs";
import { usePackageInfoStore } from "./packageInfoStore";
import { PackageInfo } from "@s/types/packageInfo";
import { WordBankItem } from "@s/types/wordbank";

export const useWordbankStore = defineStore("wordbank", () => {
    const uuid = ref<string>("");
    const wordbank = ref<WordBankItem[]>([]);
    const wordbankEnglishOnly = ref<string[]>([]);
    const alreadyDone = ref<number>(-1);

    function setCurrentData(u: string, items: WordBankItem[], done: number) {
        uuid.value = u;
        wordbank.value = items;
        wordbankEnglishOnly.value = items.map((item) => item.english);
        alreadyDone.value = done;
    }

    async function next() {
        if (alreadyDone.value >= wordbank.value.length - 1 || alreadyDone.value < 0) return;
        alreadyDone.value++;

        await TauriFsJsonAdapter.updateJsonFile<{ packages: PackageInfo[] }>(`data.json`, (obj) => {
            obj["packages"].forEach((packageInfo) => {
                if (packageInfo.uuid === uuid.value) {
                    packageInfo.current = alreadyDone.value;
                }
            });
            return obj;
        });

        await usePackageInfoStore().update();
    }

    return {
        wordbank,
        wordbankEnglishOnly,
        alreadyDone,
        setCurrentData,
        next,
    };
});
