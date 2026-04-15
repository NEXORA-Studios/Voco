<script setup lang="ts">
    import { computed, onMounted, ref } from "vue";
    import { useI18n } from "vue-i18n";
    import { useRoute } from "vue-router";
    import { usePackageInfoStore, useWordbankStore, TauriFsJsonAdapter, shuffle } from "@wM/modules";
    import type { PackageInfo, SortMethod, WordBankItem } from "@s/types";
    import { randomChineseString } from "@s/utils/randomChar";
    import { ToastController } from "@/shared/components";

    const { t } = useI18n();
    const toastController = ref<InstanceType<typeof ToastController>>();

    const route = useRoute();
    const pageData = computed(() => route.fullPath.replace("/play/", "").split("/"));
    const uuid = computed(() => pageData.value[0]);
    const startMode = computed(() => pageData.value[1] as "both" | "english" | "chinese");

    const my_modal_1 = ref<HTMLDialogElement>();

    const pkgStore = usePackageInfoStore();
    const wbStore = useWordbankStore();

    const paddingWord = ref<string>("");

    const packageInfo = ref<PackageInfo | null>(null);
    const uiCurrentIndex = computed(() => {
        if (packageInfo.value) return packageInfo.value?.current;
        return 0;
    });
    const uiTotal = computed(() => {
        if (packageInfo.value) return packageInfo.value?.total;
        return 0;
    });

    const wordbank = ref<WordBankItem[]>([]);
    const currentIndex = ref<number>(-1);

    /* 状态机变量 */
    const inShuffling = ref(false);
    const stopped = ref(false);
    const showChinese = ref(false);
    const showEnglish = ref(false);
    const inputResetSortMethod = ref<SortMethod>("shuffle");

    let timer: number | null = null;

    /* 初始化：加载并设置当前 progress */
    async function init() {
        await pkgStore.update();
        packageInfo.value = pkgStore.packageInfo.find((item) => item.uuid === uuid.value) || null;
        wordbank.value = await TauriFsJsonAdapter.readJsonFile<WordBankItem[]>(`packages/${uuid.value}.json`);

        wbStore.setCurrentData(uuid.value, wordbank.value, packageInfo.value?.current || 0);

        currentIndex.value = wbStore.alreadyDone + 1;

        startShuffle();
    }
    onMounted(init);

    /* 随机动画 */
    function startShuffle() {
        inShuffling.value = true;
        stopped.value = false;
        showChinese.value = false;
        showEnglish.value = false;

        if (timer) clearInterval(timer);

        timer = setInterval(() => {
            currentIndex.value = Math.floor(Math.random() * wordbank.value.length);
            paddingWord.value = randomChineseString(10);
        }, 60) as any;
    }

    /* 停止随机：根据 startMode 决定哪些字段立即可见 */
    function stopShuffle() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        inShuffling.value = false;
        stopped.value = true;

        currentIndex.value = wbStore.alreadyDone + 1;

        // In "english" mode: English is immediately visible, Chinese is never shown.
        // In "chinese" mode: Chinese is immediately visible, English is never shown.
        // In "both" mode: English is immediately visible, Chinese requires an extra click.
        showEnglish.value = startMode.value === "english" || startMode.value === "both";
        showChinese.value = startMode.value === "chinese";
    }

    /* 下一题 */
    async function onNext() {
        packageInfo.value = pkgStore.packageInfo.find((item) => item.uuid === uuid.value) || null;
        currentIndex.value = wbStore.alreadyDone + 1;
        startShuffle();
    }

    /* 重新开始整个包 */
    async function onRestartWholePackage() {
        let originalData: WordBankItem[];
        if (inputResetSortMethod.value === "original") {
            originalData = await TauriFsJsonAdapter.readJsonFile<WordBankItem[]>(
                `packages-original/${uuid.value}.json`,
            );
        }
        const shuffleFunc = {
            shuffle: (raw: WordBankItem[]) => shuffle(raw),
            alphabetical: (raw: WordBankItem[]) => raw.sort((a, b) => a.english.localeCompare(b.english)),
        };
        await TauriFsJsonAdapter.updateJsonFile<WordBankItem[]>(`packages/${uuid.value}.json`, (obj) =>
            inputResetSortMethod.value === "original" ? originalData : shuffleFunc[inputResetSortMethod.value](obj),
        );
        await TauriFsJsonAdapter.updateJsonFile<{ packages: PackageInfo[] }>(`data.json`, (obj) => {
            obj.packages.find((item) => item.uuid === uuid.value)!.current = 0;
            return obj;
        });
        await init();
        toastController.value?.addToast({
            type: "success",
            translate: "#toast.+main.reset-package-successful",
        });
    }

    /* 重新开始整个包（未完成整个包时） */
    async function onRestartWholePackageBeforeFinish(event: { shiftKey: boolean }) {
        if (event.shiftKey) {
            await onRestartWholePackage();
            return;
        }
        my_modal_1.value?.showModal();
    }

    /* 按钮状态机
     *
     * both:    stop → showChinese → next → …
     * english: stop → next → …          (no reveal step, Chinese never shown)
     * chinese: stop → next → …          (no reveal step, English never shown)
     */
    async function onSingleButtonClick() {
        if (!inShuffling.value && !stopped.value) {
            startShuffle();
            return;
        }

        if (inShuffling.value) {
            stopShuffle();
            return;
        }

        // "both" mode needs an extra click to reveal the translation
        if (stopped.value && startMode.value === "both" && !showChinese.value) {
            await wbStore.next();
            showChinese.value = true;
            return;
        }

        // All other stopped states → advance to next word
        if (stopped.value) {
            // For english/chinese modes, mark progress on the first "next" click
            if (startMode.value !== "both") {
                await wbStore.next();
            }
            onNext();
        }
    }

    /* 动态按钮文本 */
    const buttonLabel = computed(() => {
        if (inShuffling.value) return t("play.stop");
        if (!inShuffling.value && !stopped.value) return t("play.shuffle");

        // "both": after stopping, one more click reveals Chinese
        if (stopped.value && startMode.value === "both" && !showChinese.value) return t("play.showChinese");

        return t("play.next");
    });
</script>

<template>
    <div class="flex flex-col items-center xl:pb-16 xl:pt-28 2xl:py-32 relative">
        <button class="absolute top-4 left-4 btn btn-ghost flex gap-2 items-center" @click="$router.push('/')">
            <i class="icon-[material-symbols--arrow-back-2-outline-rounded] size-6 -mx-1 opacity-75"></i>
            <span class="text-base -translate-y-px opacity-75">{{ t("common.back") }}</span>
        </button>

        <section class="flex flex-col items-center gap-2">
            <h1 class="text-2xl font-bold">
                {{ t("play.bundle") }} {{ packageInfo?.name.split("#")[0] || t("play.unknown") }} ·
                {{ t("play.package") }}
                {{ packageInfo?.name.split("#")[1] || t("play.unknown") }}
            </h1>
            <progress class="progress progress-primary w-11/10 mt-4" :value="uiCurrentIndex + 1" :max="uiTotal" />
            <span class="text-sm text-gray-500">
                {{ t("play.progress") }} {{ uiCurrentIndex + 1 }} / {{ uiTotal }}
            </span>
        </section>

        <section class="my-auto">
            <!-- Completed state -->
            <div class="card w-md bg-base-300 dark:bg-base-200 card-md shadow-sm" v-if="uiCurrentIndex + 1 == uiTotal">
                <div class="card-body flex flex-row gap-12 justify-center items-center">
                    <img src="/firework.png" alt="firework" class="size-16 ml-4" />
                    <section class="flex flex-col items-start gap-2">
                        <h1 class="text-center text-2xl font-bold">{{ t("play.congratulations") }}</h1>
                        <span class="text-sm text-gray-500"> {{ t("play.completed") }} </span>
                    </section>
                </div>
            </div>

            <!-- Active card -->
            <div class="card w-md bg-base-300 dark:bg-base-200 card-md shadow-sm lg:scale-200" v-else>
                <div class="card-body">
                    <!-- English row: visible in "both" and "english" modes -->
                    <template v-if="startMode === 'both' || startMode === 'english'">
                        <p class="text-center">{{ t("play.currentWord") }}</p>
                        <p class="text-center text-2xl font-bold">
                            {{ currentIndex >= 0 ? wordbank[currentIndex]?.english : t("play.unknown") }}
                        </p>
                        <!-- Divider only when both sections are present -->
                        <div class="divider my-0" v-if="startMode === 'both'"></div>
                    </template>

                    <!-- Chinese row: visible in "both" and "chinese" modes -->
                    <template v-if="startMode === 'both' || startMode === 'chinese'">
                        <p class="text-center">{{ t("play.currentWord") }}</p>
                        <p
                            class="text-center text-lg"
                            :class="{
                                'blur-[6px]': startMode === 'both' && !showChinese,
                                'text-2xl font-bold': startMode === 'chinese',
                            }">
                            <!--
                                both:    blurred placeholder until revealed
                                chinese: always show real word immediately after stop
                            -->
                            {{ startMode === "both" && !showChinese ? paddingWord : wordbank[currentIndex]?.chinese }}
                        </p>
                    </template>
                </div>
            </div>
        </section>

        <section class="flex gap-4">
            <div class="flex gap-4" v-if="uiCurrentIndex + 1 == uiTotal">
                <button class="btn btn-primary" @click="$router.push('/')">{{ t("play.backToHome") }}</button>
                <button class="btn btn-warning" @click="onRestartWholePackageBeforeFinish">
                    <i class="icon-[material-symbols--restore-page-outline-rounded] size-6 -ml-2"></i>
                    {{ t("play.restartWholePackage") }}
                </button>
            </div>
            <div class="flex gap-4" v-else>
                <button class="btn btn-primary w-48" @click="onSingleButtonClick">
                    {{ buttonLabel }}
                </button>
                <button class="btn btn-error" @click="($event) => onRestartWholePackageBeforeFinish($event)">
                    <i class="icon-[material-symbols--restore-page-outline-rounded] size-6 -mx-2"></i>
                </button>
            </div>
        </section>

        <!-- 重置确认弹窗 -->
        <dialog ref="my_modal_1" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold mb-4">{{ t("home.resetConfirmTitle") }}</h3>
                <p class="text-base-content/75">{{ t("play.resetConfirm") }}</p>
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
                        <button class="btn btn-error mr-2" @click="onRestartWholePackage()">
                            {{ t("common.refresh") }}
                        </button>
                        <button class="btn">{{ t("common.cancel") }}</button>
                    </form>
                </div>
            </div>
        </dialog>

        <ToastController ref="toastController" />
    </div>
</template>
