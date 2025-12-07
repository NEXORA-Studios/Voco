<script setup lang="ts">
    import { computed, onMounted, ref } from "vue";
    import { useI18n } from "vue-i18n";
    import { useRoute } from "vue-router";
    import { usePackageInfoStore } from "../modules/stores/packageInfoStore";
    import { useWordbankStore } from "../modules/stores/wordbankStore";
    import { TauriFsJsonAdapter } from "../modules/tauri/fs";
    import type { WordBankItem } from "../types/wordbank";
    import { PackageInfo } from "../types/packageInfo";
    import { shuffle } from "../modules/data/constructor";
    import { randomChineseString } from "../utils/randomChar";

    const { t } = useI18n();

    const route = useRoute();
    const uuid = computed(() => route.fullPath.replace("/play/", ""));

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

    let timer: number | null = null;

    /* 初始化：加载并设置当前 progress */
    async function init() {
        await pkgStore.update();
        packageInfo.value = pkgStore.packageInfo.find((item) => item.uuid === uuid.value) || null;
        wordbank.value = await TauriFsJsonAdapter.readJsonFile<WordBankItem[]>(`packages/${uuid.value}.json`);

        wbStore.setCurrentData(uuid.value, wordbank.value, packageInfo.value?.current || 0);

        // 当前词 = 已完成数量 + 1
        currentIndex.value = wbStore.alreadyDone + 1;

        startShuffle();
    }
    onMounted(init);

    /* 随机动画 */
    function startShuffle() {
        inShuffling.value = true;
        stopped.value = false;
        showChinese.value = false;

        if (timer) clearInterval(timer);

        timer = setInterval(() => {
            // 随机动画仅用于视觉，不影响真正的 currentIndex
            currentIndex.value = Math.floor(Math.random() * wordbank.value.length);
            paddingWord.value = randomChineseString(10);
        }, 60) as any;
    }

    /* 停止随机：需要强制固定到真正的 current word */
    function stopShuffle() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }

        inShuffling.value = false;
        stopped.value = true;

        // ★ 强制指向真正的当前词
        currentIndex.value = wbStore.alreadyDone + 1;
    }

    /* 下一题：调用 store.next() */
    async function onNext() {
        packageInfo.value = pkgStore.packageInfo.find((item) => item.uuid === uuid.value) || null;

        // 下一项的 index
        currentIndex.value = wbStore.alreadyDone + 1;

        startShuffle();
    }

    /* 重新开始整个包 */
    async function onRestartWholePackage() {
        await TauriFsJsonAdapter.updateJsonFile<WordBankItem[]>(`packages/${uuid.value}.json`, (obj) => shuffle(obj));
        await TauriFsJsonAdapter.updateJsonFile<{ packages: PackageInfo[] }>(`data.json`, (obj) => {
            obj.packages.find((item) => item.uuid === uuid.value)!.current = 0;
            return obj;
        });
        await init();
    }

    /* 重新开始整个包（未完成整个包时） */
    async function onRestartWholePackageBeforeFinish(event: { shiftKey: boolean }) {
        // 如果按住 Shift 则直接重启整个包
        if (event.shiftKey) {
            await onRestartWholePackage();
            return;
        }
        my_modal_1.value?.showModal();
    }

    /* 按钮状态机 */
    async function onSingleButtonClick() {
        if (!inShuffling.value && !stopped.value) {
            startShuffle();
            return;
        }

        if (inShuffling.value) {
            stopShuffle();
            return;
        }

        if (stopped.value && !showChinese.value) {
            await wbStore.next();
            showChinese.value = true;
            return;
        }

        if (stopped.value && showChinese.value) {
            onNext();
            return;
        }
    }

    /* 动态按钮文本 */
    const buttonLabel = computed(() => {
        if (inShuffling.value) return t("play.stop");
        if (!inShuffling.value && !stopped.value) return t("play.shuffle");
        if (stopped.value && !showChinese.value) return t("play.showChinese");
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
            <div class="card w-md bg-base-300 dark:bg-base-200 card-md shadow-sm" v-if="uiCurrentIndex + 1 == uiTotal">
                <div class="card-body flex flex-row gap-12 justify-center items-center">
                    <img src="/firework.png" alt="firework" class="size-16 ml-4" />
                    <section class="flex flex-col items-start gap-2">
                        <h1 class="text-center text-2xl font-bold">{{ t("play.congratulations") }}</h1>
                        <span class="text-sm text-gray-500"> {{ t("play.completed") }} </span>
                    </section>
                </div>
            </div>
            <div class="card w-md bg-base-300 dark:bg-base-200 card-md shadow-sm scale-120" v-else>
                <div class="card-body">
                    <p class="text-center">{{ t("play.currentEnglish") }}</p>

                    <p class="text-center text-2xl font-bold">
                        {{ currentIndex >= 0 ? wordbank[currentIndex]?.english : t("play.unknown") }}
                    </p>

                    <div class="divider my-0"></div>

                    <p class="text-center">{{ t("play.currentChinese") }}</p>

                    <p class="text-center text-lg" :class="{ 'blur-[6px]': !showChinese }">
                        {{ showChinese ? wordbank[currentIndex]?.chinese : paddingWord }}
                    </p>
                    <!-- <p v-if="showChinese" class="text-center text-lg">
                        {{ wordbank[currentIndex]?.chinese }}
                    </p> -->
                    <!-- <div v-else class="self-center skeleton h-6 w-48 mt-1"></div> -->
                </div>
            </div>
        </section>

        <section class="flex gap-4">
            <div class="flex gap-4" v-if="uiCurrentIndex + 1 == uiTotal">
                <button class="btn btn-primary" @click="$router.push('/')">{{ t("play.backToHome") }}</button>
                <button class="btn btn-warning" @click="onRestartWholePackage">
                    <i class="icon-[material-symbols--restore-page-outline-rounded] size-6 -ml-2"></i>
                    {{ t("play.restartWholePackage") }}
                </button>
            </div>
            <div class="flex gap-4" v-else>
                <button class="btn btn-primary w-36" @click="onSingleButtonClick">
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
    </div>
</template>
