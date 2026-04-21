<script setup lang="ts">
    import { ref, computed, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import { invoke } from "@tauri-apps/api/core";
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { MyHeader, MyFooter } from "@s/layouts";
    import { ToastController } from "@s/components";
    import { RandomPickItem, RandomPickPreset } from "./types/preset";
    import { PresetStore, getTotalRemaining, hasAvailableItems } from "./modules/presetStore";

    const { t } = useI18n();
    const $app = getCurrentWindow();
    const toastController = ref<InstanceType<typeof ToastController>>();

    const presets = ref<Array<{ id: string; name: string; itemCount: number }>>([]);
    const selectedPreset = ref<RandomPickPreset | null>(null);
    const isPicking = ref(false);
    const pickResult = ref<RandomPickItem | null>(null);
    const animationItem = ref<string>("");

    const editModal = ref<HTMLDialogElement>();
    const deleteModal = ref<HTMLDialogElement>();
    const resultModal = ref<HTMLDialogElement>();

    const editingPreset = ref<RandomPickPreset | null>(null);
    const editName = ref("");
    const editItemsText = ref("");

    const isEditMode = computed(() => editingPreset.value !== null);

    // 计算总剩余次数
    const totalRemaining = computed(() => {
        if (!selectedPreset.value) return 0;
        return getTotalRemaining(selectedPreset.value.items);
    });

    // 是否还有可抽取的项目
    const canPick = computed(() => {
        if (!selectedPreset.value) return false;
        return hasAvailableItems(selectedPreset.value.items);
    });

    onMounted(async () => {
        await loadPresets();
    });

    async function loadPresets() {
        presets.value = await PresetStore.getAllPresets();
    }

    async function selectPreset(id: string) {
        selectedPreset.value = await PresetStore.getPreset(id);
        pickResult.value = null;
    }

    async function startPick() {
        if (!selectedPreset.value || !canPick.value) return;
        
        isPicking.value = true;
        pickResult.value = null;
        
        const availableItems = selectedPreset.value.items.filter(item => (item.remaining ?? 1) > 0);
        const duration = 2000;
        const interval = 100;
        const steps = duration / interval;
        
        // 动画阶段：随机显示可用的项目
        for (let i = 0; i < steps; i++) {
            const randomIndex = Math.floor(Math.random() * availableItems.length);
            animationItem.value = availableItems[randomIndex]?.value || "";
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
        
        // 实际抽取并更新
        const result = await PresetStore.pickAndUpdate(selectedPreset.value);
        
        if (result) {
            pickResult.value = result;
            animationItem.value = result.value;
            
            // 刷新选中预设的数据
            selectedPreset.value = await PresetStore.getPreset(selectedPreset.value.id);
            
            isPicking.value = false;
            resultModal.value?.showModal();
        } else {
            isPicking.value = false;
            toastController.value?.addToast({
                type: "warning",
                translate: "#toast.+randompick.no-available",
            });
        }
    }

    async function resetPreset() {
        if (!selectedPreset.value) return;
        
        try {
            await PresetStore.resetPreset(selectedPreset.value.id);
            selectedPreset.value = await PresetStore.getPreset(selectedPreset.value.id);
            toastController.value?.addToast({
                type: "success",
                translate: "#toast.+randompick.reset-success",
            });
        } catch (error) {
            toastController.value?.addToast({
                type: "error",
                translate: "#toast.+randompick.reset-error",
            });
        }
    }

    function openCreateModal() {
        editingPreset.value = null;
        editName.value = "";
        editItemsText.value = "";
        editModal.value?.showModal();
    }

    function openEditModal(preset: typeof presets.value[0]) {
        PresetStore.getPreset(preset.id).then((p) => {
            if (p) {
                editingPreset.value = p;
                editName.value = p.name;
                editItemsText.value = p.items.map((item) => {
                    if (item.count !== undefined && item.count !== 1) {
                        return `${item.value}::${item.count}`;
                    }
                    return item.value;
                }).join("\n");
                editModal.value?.showModal();
            }
        });
    }

    function openDeleteModal(preset: typeof presets.value[0]) {
        editingPreset.value = { id: preset.id, name: preset.name, items: [], createdAt: 0, updatedAt: 0 };
        deleteModal.value?.showModal();
    }

    function parseItemsText(text: string): RandomPickItem[] {
        return text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
                const parts = line.split("::");
                if (parts.length >= 2) {
                    const count = parseInt(parts[parts.length - 1], 10);
                    if (!isNaN(count) && count > 0) {
                        return {
                            value: parts.slice(0, -1).join("::").trim(),
                            count,
                        };
                    }
                }
                return { value: line, count: 1 };
            });
    }

    async function savePreset() {
        if (!editName.value.trim()) {
            toastController.value?.addToast({
                type: "error",
                translate: "#toast.+randompick.name-required",
            });
            return;
        }

        const items = parseItemsText(editItemsText.value);
        if (items.length === 0) {
            toastController.value?.addToast({
                type: "error",
                translate: "#toast.+randompick.items-required",
            });
            return;
        }

        try {
            if (isEditMode.value && editingPreset.value) {
                await PresetStore.updatePreset(editingPreset.value.id, {
                    name: editName.value.trim(),
                    items,
                });
                toastController.value?.addToast({
                    type: "success",
                    translate: "#toast.+randompick.update-success",
                });
            } else {
                await PresetStore.createPreset(editName.value.trim(), items);
                toastController.value?.addToast({
                    type: "success",
                    translate: "#toast.+randompick.create-success",
                });
            }
            
            editModal.value?.close();
            await loadPresets();
            
            if (selectedPreset.value?.id === editingPreset.value?.id) {
                selectedPreset.value = await PresetStore.getPreset(editingPreset.value!.id);
            }
        } catch (error) {
            toastController.value?.addToast({
                type: "error",
                translate: "#toast.+randompick.save-error",
            });
        }
    }

    async function confirmDelete() {
        if (!editingPreset.value) return;
        
        try {
            await PresetStore.deletePreset(editingPreset.value.id);
            toastController.value?.addToast({
                type: "success",
                translate: "#toast.+randompick.delete-success",
            });
            deleteModal.value?.close();
            
            if (selectedPreset.value?.id === editingPreset.value.id) {
                selectedPreset.value = null;
            }
            
            await loadPresets();
        } catch (error) {
            toastController.value?.addToast({
                type: "error",
                translate: "#toast.+randompick.delete-error",
            });
        }
    }

    async function handleClose() {
        await invoke("close_randompick_window");
    }

    // 获取项目的显示文本（显示剩余/总数）
    // function getItemCountDisplay(item: RandomPickItem): string {
    //     const total = item.count ?? 1;
    //     const remaining = item.remaining ?? total;
    //     if (remaining === 0) {
    //         return "(0)";
    //     }
    //     if (total > 1) {
    //         return `(${remaining}/${total})`;
    //     }
    //     return "";
    // }

    // 判断项目是否已抽完
    function isItemDepleted(item: RandomPickItem): boolean {
        return (item.remaining ?? item.count ?? 1) === 0;
    }
</script>

<template>
    <div class="mygrid">
        <MyHeader
            extraTextKey="+randompick.title"
            @minimize="$app.minimize()"
            @toggleMaximize="$app.toggleMaximize()"
            @close="handleClose()" />
        <main class="p-6 flex gap-6 h-full">
            <!-- Left: Preset List -->
            <div class="w-1/3 flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold">{{ t("+randompick.presets") }}</h2>
                    <button class="btn btn-primary btn-sm" @click="openCreateModal">
                        <i class="icon-[material-symbols--add] size-5"></i>
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-2 space-y-2">
                    <div
                        v-for="preset in presets"
                        :key="preset.id"
                        class="card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                        :class="{ 'ring-2 ring-primary': selectedPreset?.id === preset.id }"
                        @click="selectPreset(preset.id)">
                        <div class="card-body p-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-semibold">{{ preset.name }}</h3>
                                    <p class="text-sm text-base-content/60">
                                        {{ t("+randompick.item-count", { count: preset.itemCount }) }}
                                    </p>
                                </div>
                                <div class="flex gap-1">
                                    <button
                                        class="btn btn-ghost btn-xs"
                                        @click.stop="openEditModal(preset)">
                                        <i class="icon-[material-symbols--edit] size-4"></i>
                                    </button>
                                    <button
                                        class="btn btn-ghost btn-xs text-error"
                                        @click.stop="openDeleteModal(preset)">
                                        <i class="icon-[material-symbols--delete] size-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="presets.length === 0" class="text-center text-base-content/50 py-8">
                        {{ t("+randompick.no-presets") }}
                    </div>
                </div>
            </div>

            <!-- Right: Pick Area -->
            <div class="flex-1 flex flex-col gap-4 relative">
                <div v-if="selectedPreset" class="card bg-base-200 flex-1 relative overflow-hidden">
                    <div class="card-body flex flex-col h-full">
                        <div class="flex justify-between items-center relative">
                            <h2 class="text-2xl font-bold text-center flex-1">{{ selectedPreset.name }}</h2>
                            <button 
                                class="btn btn-outline border-primary/15 btn-sm absolute right-0" 
                                @click="resetPreset"
                                :title="t('+randompick.reset')">
                                <i class="icon-[material-symbols--refresh] size-5"></i>
                            </button>
                        </div>
                        
                        <!-- 剩余次数显示 -->
                        <div class="text-center text-sm text-base-content/60 mt-2">
                            {{ t("+randompick.remaining", { count: totalRemaining }) }}
                        </div>
                        
                        <!-- Normal Items Display (hidden when picking) -->
                        <div v-if="!isPicking" class="flex-1 overflow-y-auto my-4">
                            <div class="flex flex-wrap gap-2 justify-center">
                                <span
                                    v-for="(item, index) in selectedPreset.items"
                                    :key="index"
                                    class="badge badge-lg"
                                    :class="{
                                        'badge-secondary': !isItemDepleted(item),
                                        'badge-ghost opacity-40': isItemDepleted(item),
                                    }">
                                    {{ item.value }}
                                    <!-- <span v-if="getItemCountDisplay(item)" 
                                          class="ml-1"
                                          :class="{ 'text-error': isItemDepleted(item) }">
                                        {{ getItemCountDisplay(item) }}
                                    </span> -->
                                </span>
                            </div>
                        </div>

                        <!-- Fullscreen Picking Display -->
                        <div
                            v-if="isPicking"
                            class="absolute inset-0 bg-base-300 flex flex-col items-center justify-center z-10">
                            <div class="text-6xl md:text-8xl font-bold text-primary animate-pulse text-center px-4">
                                {{ animationItem }}
                            </div>
                            <div class="mt-8 text-xl text-base-content/60">
                                {{ t("+randompick.picking") }}
                            </div>
                        </div>

                        <!-- Pick Button -->
                        <div v-if="!isPicking" class="text-center">
                            <button
                                class="btn btn-primary btn-lg"
                                @click="startPick"
                                :disabled="!canPick">
                                {{ t("+randompick.pick") }}
                            </button>
                            <div v-if="!canPick" class="text-sm text-warning mt-2">
                                {{ t("+randompick.all-picked") }}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div v-else class="card bg-base-200 flex-1 flex items-center justify-center">
                    <div class="text-center text-base-content/50">
                        <i class="icon-[material-symbols--casino] size-16 mb-4 opacity-50"></i>
                        <p>{{ t("+randompick.select-preset") }}</p>
                    </div>
                </div>
            </div>
        </main>
        <MyFooter />
        <ToastController ref="toastController" />

        <!-- Edit/Create Modal -->
        <dialog ref="editModal" class="modal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="text-lg font-bold mb-4">
                    {{ isEditMode ? t("+randompick.edit-title") : t("+randompick.create-title") }}
                </h3>
                
                <div class="form-control mb-4 space-x-4">
                    <label class="label">
                        <span class="label-text">{{ t("+randompick.preset-name") }}</span>
                    </label>
                    <input
                        v-model="editName"
                        type="text"
                        class="input input-bordered"
                        :placeholder="t('+randompick.name-placeholder')" />
                </div>

                <div class="form-control mb-4 space-y-2">
                    <label class="label">
                        <span class="label-text">{{ t("+randompick.preset-items") }}</span>
                        <span class="label-text-alt">{{ t("+randompick.items-hint") }}</span>
                    </label>
                    <textarea
                        v-model="editItemsText"
                        class="textarea textarea-bordered w-full h-48 font-mono text-sm"
                        :placeholder="t('+randompick.items-placeholder')"></textarea>
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary" @click="savePreset">
                        {{ t("common.save") }}
                    </button>
                    <button class="btn" @click="editModal?.close()">
                        {{ t("common.cancel") }}
                    </button>
                </div>
            </div>
        </dialog>

        <!-- Delete Confirm Modal -->
        <dialog ref="deleteModal" class="modal">
            <div class="modal-box">
                <h3 class="text-lg font-bold mb-4">{{ t("+randompick.delete-title") }}</h3>
                <p class="text-base-content/75">
                    {{ t("+randompick.delete-confirm", { name: editingPreset?.name }) }}
                </p>
                <div class="modal-action">
                    <button class="btn btn-error" @click="confirmDelete">
                        {{ t("common.delete") }}
                    </button>
                    <button class="btn" @click="deleteModal?.close()">
                        {{ t("common.cancel") }}
                    </button>
                </div>
            </div>
        </dialog>

        <!-- Result Modal -->
        <dialog ref="resultModal" class="modal">
            <div class="modal-box text-center">
                <h3 class="text-lg font-bold mb-4">{{ t("+randompick.result-title") }}</h3>
                <div class="py-8">
                    <div class="text-4xl font-bold text-primary">{{ pickResult?.value }}</div>
                    <!-- <div v-if="pickResult?.count && pickResult.count > 1" class="text-lg text-base-content/60 mt-2">
                        {{ t("+randompick.result-remaining", { remaining: pickResult.remaining, count: pickResult.count }) }}
                    </div> -->
                </div>
                <div class="modal-action justify-center">
                    <button class="btn btn-primary" @click="resultModal?.close()">
                        {{ t("common.ok") }}
                    </button>
                </div>
            </div>
        </dialog>
    </div>
</template>

<style scoped>
    .mygrid {
        display: grid;
        grid-template-rows: calc(var(--spacing) * 12) 1fr calc(var(--spacing) * 12);
        grid-template-columns: 1fr;
        height: 100%;
    }
</style>
