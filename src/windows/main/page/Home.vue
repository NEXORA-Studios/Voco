<script setup lang="ts">
    import { computed, ref } from "vue";
    import { useI18n } from "vue-i18n";
    // import { openUrl } from "@tauri-apps/plugin-opener";
    import { PackageItem } from "@wM/components";
    import { ScrollContainer, ToastController } from "@s/components";
    import { makeDataXlsx, shuffle, TauriFsJsonAdapter, TauriFs, usePackageInfoStore } from "@wM/modules";
    import { MultiWindowBridge } from "@s/modules";
    import { PackageInfo, WordBankItem, SortMethod } from "@s/types";
    import { invoke } from "@tauri-apps/api/core";

    const { t } = useI18n();

    const packageInfos = computed(() => usePackageInfoStore().packageInfo);
    const flattenPackageInfo = computed(() => usePackageInfoStore().flattenPackageInfo);

    const my_modal_1 = ref<HTMLDialogElement>();
    const my_modal_2 = ref<HTMLDialogElement>();
    const my_modal_3 = ref<HTMLDialogElement>();
    const toastController = ref<InstanceType<typeof ToastController>>();

    const my_modal_2_packageInfo = ref<PackageInfo>();
    const my_modal_3_packageInfo = ref<PackageInfo>();

    const inputBundleName = ref<string>("");
    const inputPackageName = ref<string>("");
    const inputDescription = ref<string>("");
    const inputSortMethod = ref<SortMethod>("shuffle");
    const inputResetSortMethod = ref<SortMethod>("shuffle");
    const selectedData = ref<[string, string][]>([]);
    const createDisabled = computed(
        () => inputBundleName.value.length > 0 && inputPackageName.value.length > 0 && selectedData.value.length > 0,
    );
    const selectDataDisabled = ref<boolean>(false);

    // 跨窗口 IPC 事件监听
    MultiWindowBridge.on<{ payload: [string, string][] }>("load_package_data", (data) => {
        selectedData.value = data.payload.payload;
        console.log(selectedData.value);
        selectDataDisabled.value = false;
    });
    MultiWindowBridge.on("select_window_closed_without_sending_data", () => {
        selectDataDisabled.value = false;
    });

    // 表单相关
    async function createPackage() {
        if (!createDisabled.value || selectedData.value.length === 0) return;
        const [packageInfo, data] = makeDataXlsx(
            inputBundleName.value + "#" + inputPackageName.value,
            inputDescription.value,
            selectedData.value,
            inputSortMethod.value,
        );
        await TauriFsJsonAdapter.writeJsonFile(`packages/${packageInfo.uuid}.json`, data);
        const [, dataOriginal] = makeDataXlsx(
            inputBundleName.value + "#" + inputPackageName.value,
            inputDescription.value,
            selectedData.value,
            "original",
        );
        await TauriFsJsonAdapter.writeJsonFile(`packages-original/${packageInfo.uuid}.json`, dataOriginal);
        await TauriFsJsonAdapter.updateJsonFile<{ packages: PackageInfo[] }>("data.json", (oldObj) => {
            (oldObj["packages"] as Record<string, any>[]).push(packageInfo);
            return oldObj;
        });
        await TauriFsJsonAdapter.writeJsonFile(`packages/${packageInfo.uuid}.json`, data);
        await usePackageInfoStore().update();
        cleanUp();
        toastController.value?.addToast({
            type: "success",
            translate: "#toast.+main.create-package-successful",
        });
    }

    function cleanUp() {
        my_modal_1.value?.close();
        invoke("close_select_window");
        inputBundleName.value = "";
        inputPackageName.value = "";
        inputDescription.value = "";
        selectedData.value = [];
        selectDataDisabled.value = false;
    }

    // 功能函数
    async function deletePackage(uuid: PackageInfo["uuid"]) {
        await TauriFsJsonAdapter.updateJsonFile<{ packages: PackageInfo[] }>("data.json", (oldObj) => {
            (oldObj["packages"] as Record<string, any>[]).splice(
                (oldObj["packages"] as Record<string, any>[]).findIndex((item) => item.uuid === uuid),
                1,
            );
            return oldObj;
        });
        await TauriFs.remove(`packages/${uuid}.json`);
        await TauriFs.remove(`packages-original/${uuid}.json`);
        await usePackageInfoStore().update();
        toastController.value?.addToast({
            type: "success",
            translate: "#toast.+main.delete-package-successful",
        });
    }

    async function resetPackage(uuid: PackageInfo["uuid"]) {
        let originalData: WordBankItem[];
        if (inputResetSortMethod.value === "original") {
            originalData = await TauriFsJsonAdapter.readJsonFile<WordBankItem[]>(`packages-original/${uuid}.json`);
        } else {
        }
        const shuffleFunc = {
            shuffle: (raw: WordBankItem[]) => shuffle(raw),
            alphabetical: (raw: WordBankItem[]) => raw.sort((a, b) => a.english.localeCompare(b.english)),
        };
        await TauriFsJsonAdapter.updateJsonFile<WordBankItem[]>(`packages/${uuid}.json`, (obj) =>
            inputResetSortMethod.value === "original" ? originalData : shuffleFunc[inputResetSortMethod.value](obj),
        );
        await TauriFsJsonAdapter.updateJsonFile<{ packages: PackageInfo[] }>(`data.json`, (obj) => {
            obj.packages.find((item) => item.uuid === uuid)!.current = 0;
            return obj;
        });
        await usePackageInfoStore().update();
        toastController.value?.addToast({
            type: "success",
            translate: "#toast.+main.reset-package-successful",
        });
    }

    // 按钮槽函数
    async function onPackageItemDelete(item: PackageInfo, event: MouseEvent) {
        // 如果按住 Shift 则直接删掉
        if (event.shiftKey) {
            await deletePackage(item.uuid);
            return;
        }
        my_modal_2_packageInfo.value = item;
        my_modal_2.value?.showModal();
    }

    async function onPackageItemReset(item: PackageInfo, event: MouseEvent) {
        // 如果按住 Shift 则直接重置
        if (event.shiftKey) {
            inputResetSortMethod.value = "shuffle";
            await resetPackage(item.uuid);
            return;
        }
        my_modal_3_packageInfo.value = item;
        my_modal_3.value?.showModal();
    }

    function onOpenSelectUI() {
        if (selectDataDisabled.value) return;
        selectDataDisabled.value = true;
        invoke("open_select_window");
    }
</script>

<template>
    <main class="flex flex-col h-full items-center justify-center gap-2">
        <h1 class="text-3xl font-bold text-center text-base-content">{{ t("home.title") }}</h1>
        <p class="text-center text-base-content/50">
            {{ t("home.subtitle") }}
        </p>
        <!-- 列表 -->
        <div class="card bg-transparent outline outline-base-content/25 mt-8 w-full max-w-3xl">
            <div class="card-body">
                <span class="text-base-content/50 text-center" v-if="packageInfos.length === 0">{{
                    t("home.noPackages")
                }}</span>
                <ScrollContainer class="h-48 2xl:h-96" v-else>
                    <div
                        class="collapse collapse-arrow bg-base-200 border-base-300 border w-full mb-2 outline-none"
                        v-for="(bundle, key) in flattenPackageInfo">
                        <input type="checkbox" />
                        <div class="collapse-title font-semibold -mb-4">{{ t("home.bundle") }} {{ key }}</div>
                        <div class="collapse-content text-sm p-2">
                            <ul class="list bg-base-100 rounded-box shadow-md w-full mt-2">
                                <PackageItem
                                    :bundle="bundle"
                                    @play="(item) => $router.push(`/play/${item.uuid}`)"
                                    @delete="(item, event) => onPackageItemDelete(item, event)"
                                    @reset="(item, event) => onPackageItemReset(item, event)" />
                            </ul>
                        </div>
                    </div>
                </ScrollContainer>
            </div>
        </div>

        <!-- 按钮 -->
        <div class="flex items-center justify-center gap-4 mt-8">
            <button class="btn btn-primary" @click="my_modal_1?.showModal()">
                <i class="icon-[material-symbols--add-box-rounded] size-6 -ml-2"></i>
                <span class="-mr-1 -translate-y-px">{{ t("home.createNew") }}</span>
            </button>
            <button class="btn btn-primary btn-outline" @click="$router.push('/settings')">
                <i class="icon-[material-symbols--settings-account-box-outline-rounded] size-6 -ml-2"></i>
                <span class="-mr-1 -translate-y-px">{{ t("home.settings") }}</span>
            </button>
        </div>
        <!-- 创建弹窗 -->
        <dialog ref="my_modal_1" class="modal">
            <div class="modal-box w-xl! max-w-xl!">
                <h3 class="text-lg font-bold mb-4">{{ t("home.createModalTitle") }}</h3>
                <section class="grid grid-cols-[1fr_3fr] grid-rows-3 gap-x-4 gap-y-2 items-center">
                    <span class="font-bold">{{ t("home.dataFile") }}<span class="text-red-500">*</span></span>
                    <div class="flex h-full gap-2">
                        <div
                            class="w-1/3 h-full flex items-center justify-center rounded-sm"
                            :class="{
                                'bg-error/25 border border-error/50': selectedData.length == 0,
                                'bg-success/25 border border-success/50': selectedData.length > 0,
                            }">
                            {{
                                selectedData.length == 0
                                    ? t("home.noData")
                                    : t("home.hasData", { count: selectedData.length })
                            }}
                        </div>
                        <button
                            class="btn w-2/3 btn-primary"
                            :class="{ 'btn-outline': selectedData.length > 0 }"
                            @click="onOpenSelectUI"
                            :disabled="selectDataDisabled">
                            {{ selectDataDisabled ? t("+select.selectButton", 2) : t("home.uploadFile") }}
                        </button>
                    </div>
                    <span class="font-bold">{{ t("home.bundleName") }}<span class="text-red-500">*</span></span>
                    <input
                        type="text"
                        :placeholder="t('home.autoFilled')"
                        class="input w-full outline-none"
                        v-model="inputBundleName" />
                    <span class="font-bold">{{ t("home.packageName") }}<span class="text-red-500">*</span></span>
                    <input
                        type="text"
                        :placeholder="t('home.autoFilled')"
                        class="input w-full outline-none"
                        v-model="inputPackageName" />
                    <span class="font-bold">{{ t("home.description") }}</span>
                    <input
                        type="text"
                        :placeholder="t('home.optional')"
                        class="input w-full outline-none"
                        v-model="inputDescription" />
                    <span class="font-bold">{{ t("home.sortMethod") }}<span class="text-red-500">*</span></span>
                    <select v-model="inputSortMethod" class="select select-primary w-full outline-none">
                        <option value="shuffle">{{ t("home.shuffle") }}</option>
                        <option value="alphabetical">{{ t("home.alphabetical") }}</option>
                        <option value="original">{{ t("home.original") }}</option>
                    </select>
                </section>
                <div class="modal-action">
                    <!-- <button
                        class="btn btn-secondary btn-outline"
                        @click="
                            openUrl('https://github.com/NEXORA-Studios/Voco/wiki/How-to-prepare-an-CSV-Wordbank-File')
                        ">
                        {{ t("common.help") }}
                    </button> -->
                    <button class="btn btn-success" :disabled="!createDisabled" @click="createPackage">
                        {{ t("common.save") }}
                    </button>
                    <button class="btn" @click="cleanUp">{{ t("common.close") }}</button>
                </div>
            </div>
        </dialog>
        <!-- 删除确认弹窗 -->
        <dialog ref="my_modal_2" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold mb-4">{{ t("home.deleteConfirmTitle") }}</h3>
                <p class="text-base-content/75">
                    {{ t("home.deleteConfirm") }}
                    <kbd class="kbd -translate-y-px">{{ my_modal_2_packageInfo?.name.split("#")[1] }}</kbd>
                    {{ t("home.fromBundle") }}
                    <kbd class="kbd -translate-y-px">{{ my_modal_2_packageInfo?.name.split("#")[0] }}</kbd>
                    ?
                </p>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-error mr-2" @click="deletePackage(my_modal_2_packageInfo?.uuid || '')">
                            {{ t("common.delete") }}
                        </button>
                        <button class="btn">{{ t("common.cancel") }}</button>
                    </form>
                </div>
            </div>
        </dialog>
        <!-- 重置确认弹窗 -->
        <dialog ref="my_modal_3" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold mb-4">{{ t("home.resetConfirmTitle") }}</h3>
                <p class="text-base-content/75">
                    {{ t("home.resetConfirm") }}
                    <kbd class="kbd -translate-y-px">{{ my_modal_3_packageInfo?.name.split("#")[1] }}</kbd>
                    {{ t("home.fromBundleReset") }}
                    <kbd class="kbd -translate-y-px">{{ my_modal_3_packageInfo?.name.split("#")[0] }}</kbd>
                    ?
                </p>
                <section class="grid grid-cols-[1fr_3fr] grid-rows-1 gap-x-4 mt-2 items-center">
                    <span class="font-bold">{{ t("home.sortMethod") }}<span class="text-red-500">*</span></span>
                    <select v-model="inputResetSortMethod" class="select select-sm select-primary w-full outline-none">
                        <option value="shuffle">{{ t("home.shuffle") }}</option>
                        <option value="alphabetical">{{ t("home.alphabetical") }}</option>
                        <option value="original">{{ t("home.original") }}</option>
                    </select>
                </section>
                <div class="modal-action">
                    <form method="dialog">
                        <button class="btn btn-error mr-2" @click="resetPackage(my_modal_3_packageInfo?.uuid || '')">
                            {{ t("common.refresh") }}
                        </button>
                        <button class="btn">{{ t("common.cancel") }}</button>
                    </form>
                </div>
            </div>
        </dialog>
        <ToastController ref="toastController" />
    </main>
</template>
