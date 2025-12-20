<script setup lang="ts">
    import { ref } from "vue";
    import { open } from "@tauri-apps/plugin-dialog";
    import { invoke } from "@tauri-apps/api/core";
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import { MyHeader, MyFooter } from "@s/layouts";
    import { ScrollContainer, ToastController } from "@s/components";
    import { RlsxSpreadsheet } from "@wS/types/Rlsx";
    import { MultiWindowBridge } from "@/shared/modules";

    const $app = getCurrentWindow();
    const toastController = ref<InstanceType<typeof ToastController>>();

    const sheetIndex = ref(0);
    const isLoading = ref(false);
    const workbooks = ref<RlsxSpreadsheet>({} as RlsxSpreadsheet);
    const fileName = ref<string | null>(null);

    const selectedEnData = ref<string[]>([]);
    const selectedCnData = ref<string[]>([]);

    const selectedCells = ref<Set<string>>(new Set());
    const isDragging = ref(false);
    const dragStart = ref<{
        type: "cell" | "row" | "col";
        sheetIndex: number;
        rowIndex?: number;
        colIndex?: number;
    } | null>(null);

    const lastAnchor = ref<{
        sheetIndex: number;
        rowIndex: number;
        colIndex: number;
    } | null>(null);

    const isCtrlPressed = ref(false);
    const isShiftPressed = ref(false);

    window.addEventListener("keydown", (e) => {
        if (e.key === "Control") isCtrlPressed.value = true;
        if (e.key === "Shift") isShiftPressed.value = true;
    });

    window.addEventListener("keyup", (e) => {
        if (e.key === "Control") isCtrlPressed.value = false;
        if (e.key === "Shift") isShiftPressed.value = false;
    });

    function decodeHtmlEntities(input: string): string {
        const txt = document.createElement("textarea");
        txt.innerHTML = input;
        return txt.value;
    }

    function toggleCell(sheetIndex: number, row: number, col: number) {
        const key = cellKey(sheetIndex, row, col);
        if (selectedCells.value.has(key)) {
            selectedCells.value.delete(key);
        } else {
            selectedCells.value.add(key);
        }
    }

    function numberToColumn(n: number): string {
        let result = "";
        while (n > 0) {
            n--;
            const charCode = (n % 26) + 65;
            result = String.fromCharCode(charCode) + result;
            n = Math.floor(n / 26);
        }
        return result;
    }

    function cellKey(sheetIndex: number, rowIndex: number, colIndex: number) {
        return `${sheetIndex}-${rowIndex}-${colIndex}`;
    }

    // 矩形选中
    function selectRectangle(sheetIndex: number, startRow: number, startCol: number, endRow: number, endCol: number) {
        if (!isCtrlPressed.value && !isShiftPressed.value) {
            selectedCells.value.clear();
        }

        const rowMin = Math.min(startRow, endRow);
        const rowMax = Math.max(startRow, endRow);
        const colMin = Math.min(startCol, endCol);
        const colMax = Math.max(startCol, endCol);

        for (let r = rowMin; r <= rowMax; r++) {
            for (let c = colMin; c <= colMax; c++) {
                selectedCells.value.add(cellKey(sheetIndex, r, c));
            }
        }
    }

    // 整行选中
    function selectRows(sheetIndex: number, startRow: number, endRow: number) {
        if (!isCtrlPressed.value && !isShiftPressed.value) {
            selectedCells.value.clear();
        }

        const rMin = Math.min(startRow, endRow);
        const rMax = Math.max(startRow, endRow);
        const sheet = workbooks.value.sheets[sheetIndex];
        for (let r = rMin; r <= rMax; r++) {
            for (let c = 0; c < sheet.rows[r].length; c++) {
                selectedCells.value.add(cellKey(sheetIndex, r, c));
            }
        }
    }

    // 整列选中
    function selectCols(sheetIndex: number, startCol: number, endCol: number) {
        if (!isCtrlPressed.value && !isShiftPressed.value) {
            selectedCells.value.clear();
        }

        const cMin = Math.min(startCol, endCol);
        const cMax = Math.max(startCol, endCol);
        const sheet = workbooks.value.sheets[sheetIndex];
        for (let r = 0; r < sheet.rows.length; r++) {
            for (let c = cMin; c <= cMax; c++) {
                selectedCells.value.add(cellKey(sheetIndex, r, c));
            }
        }
    }

    // 开始拖动
    function startDragCell(sheetIndex: number, rowIndex: number, colIndex: number) {
        const key = cellKey(sheetIndex, rowIndex, colIndex);

        // Shift：连续选区
        if (isShiftPressed.value && lastAnchor.value) {
            const a = lastAnchor.value;
            selectedCells.value.clear();
            selectRectangle(sheetIndex, a.rowIndex, a.colIndex, rowIndex, colIndex);
            return;
        }

        // Ctrl：叠加 / 取消
        if (isCtrlPressed.value) {
            toggleCell(sheetIndex, rowIndex, colIndex);
            lastAnchor.value = { sheetIndex, rowIndex, colIndex };
            return;
        }

        // 普通点击
        selectedCells.value.clear();
        selectedCells.value.add(key);
        lastAnchor.value = { sheetIndex, rowIndex, colIndex };

        isDragging.value = true;
        dragStart.value = { type: "cell", sheetIndex, rowIndex, colIndex };
    }

    function startDragRow(sheetIndex: number, rowIndex: number) {
        if (!isCtrlPressed.value && !isShiftPressed.value) {
            selectedCells.value.clear();
        }

        isDragging.value = true;
        dragStart.value = { type: "row", sheetIndex, rowIndex };
        selectRows(sheetIndex, rowIndex, rowIndex);
    }

    function startDragCol(sheetIndex: number, colIndex: number) {
        if (!isCtrlPressed.value && !isShiftPressed.value) {
            selectedCells.value.clear();
        }

        isDragging.value = true;
        dragStart.value = { type: "col", sheetIndex, colIndex };
        selectCols(sheetIndex, colIndex, colIndex);
    }

    // 拖动中
    function dragOverCell(sheetIndex: number, rowIndex: number, colIndex: number) {
        if (!isDragging.value || !dragStart.value) return;
        const start = dragStart.value;
        if (sheetIndex !== start.sheetIndex) return;

        if (start.type === "cell" && start.rowIndex !== undefined && start.colIndex !== undefined) {
            selectRectangle(sheetIndex, start.rowIndex, start.colIndex, rowIndex, colIndex);
        } else if (start.type === "row" && start.rowIndex !== undefined) {
            selectRows(sheetIndex, start.rowIndex, rowIndex);
        } else if (start.type === "col" && start.colIndex !== undefined) {
            selectCols(sheetIndex, start.colIndex, colIndex);
        }
    }

    function endDrag() {
        isDragging.value = false;
        dragStart.value = null;
    }

    // 文件选择
    async function selectFile() {
        isLoading.value = true;
        try {
            const file = await open({ multiple: false, filters: [{ name: "Excel Files", extensions: ["xlsx"] }] });
            if (file && typeof file === "string") {
                fileName.value = file.split("\\").pop() || file;
                await loadExcelFile(file);
            }
        } catch (err) {
            console.error("Error loading Excel:", err);
            toastController.value?.addToast({
                type: "error",
                translate: ["#toast.+select.load-error", { error: err instanceof Error ? err.message : "Unknown" }],
            });
        } finally {
            isLoading.value = false;
        }
    }

    async function loadExcelFile(filePath: string) {
        isLoading.value = true;
        try {
            const result = await invoke<string>("load_xlsx", { path: filePath });
            workbooks.value = JSON.parse(result);
            toastController.value?.addToast({ type: "success", translate: "#toast.+select.load-success" });
        } catch (err) {
            console.error("Error loading Excel:", err);
            toastController.value?.addToast({
                type: "error",
                translate: [
                    "#toast.+select.load-error",
                    { error: err instanceof Error ? err.message : "Failed to load Excel file" },
                ],
            });
        } finally {
            isLoading.value = false;
        }
    }

    function getSelectedData(): string[] {
        const sheet = workbooks.value.sheets[sheetIndex.value];
        if (!sheet) return [];

        // 把选中的 key 转换成坐标
        const coords = Array.from(selectedCells.value)
            .map((key) => {
                const [sIdx, row, col] = key.split("-").map(Number);
                return { sIdx, row, col };
            })
            .filter((c) => c.sIdx === sheetIndex.value);

        // 按行优先排序：先 row 再 col
        coords.sort((a, b) => a.row - b.row || a.col - b.col);

        // 提取内容
        const data: string[] = [];
        for (const c of coords) {
            const row = sheet.rows[c.row];
            if (row && row[c.col]) {
                data.push(row[c.col].value.String);
            }
        }

        console.debug("Selected data:", data);
        return data;
    }

    function setEnData() {
        selectedEnData.value = getSelectedData();
        toastController.value?.addToast({ type: "success", translate: "#toast.+select.en-data-selected" });
    }

    function setCnData() {
        selectedCnData.value = getSelectedData();
        toastController.value?.addToast({ type: "success", translate: "#toast.+select.cn-data-selected" });
    }

    // 高亮控制
    function isCellSelected(sheetIndex: number, row: number, col: number) {
        return selectedCells.value.has(cellKey(sheetIndex, row, col));
    }

    function getCellBoxShadow(sheetIndex: number, row: number, col: number) {
        if (!isCellSelected(sheetIndex, row, col)) return "";

        const shadows: string[] = [];

        if (!isCellSelected(sheetIndex, row - 1, col)) {
            shadows.push("inset 0 2px 0 var(--color-primary)");
        }
        if (!isCellSelected(sheetIndex, row + 1, col)) {
            shadows.push("inset 0 -2px 0 var(--color-primary)");
        }
        if (!isCellSelected(sheetIndex, row, col - 1)) {
            shadows.push("inset 2px 0 0 var(--color-primary)");
        }
        if (!isCellSelected(sheetIndex, row, col + 1)) {
            shadows.push("inset -2px 0 0 var(--color-primary)");
        }

        return shadows.join(", ");
    }

    async function sendSelectedData() {
        // 检查数据是否合法
        if (selectedEnData.value.length !== selectedCnData.value.length) {
            toastController.value?.addToast({
                type: "error",
                translate: "#toast.+select.data-count-mismatch",
            });
            return;
        }

        // selectEnData, selectCnData 每 1 项组成 1 组 [en, cn]
        const payload = [];
        for (let i = 0; i < selectedEnData.value.length; i++) {
            payload.push([selectedEnData.value[i], selectedCnData.value[i]]);
        }
        await MultiWindowBridge.emit("main", "load_package_data", {
            payload,
        });
        await invoke("close_select_window");
    }

    async function handleClose() {
        await MultiWindowBridge.emit("main", "select_window_closed_without_sending_data");
        await invoke("close_select_window");
    }
</script>

<template>
    <div class="mygrid">
        <MyHeader
            extraTextKey="+select.title"
            @minimize="$app.minimize()"
            @toggleMaximize="$app.toggleMaximize()"
            @close="handleClose()" />
        <main class="p-6">
            <div class="flex justify-between items-center">
                <button class="btn btn-primary w-full max-w-xs" @click="selectFile" :disabled="isLoading">
                    <span v-if="isLoading">{{ $t("+select.selectButton", 2) }}</span>
                    <span v-else>{{ $t("+select.selectButton") }}</span>
                </button>
                <div class="flex flex-col gap-0 items-center">
                    <span v-if="fileName" class="text-sm text-base-content/70">{{
                        $t("+select.hasSelect", { filename: fileName })
                    }}</span>
                    <span v-else class="text-sm text-base-content/70">{{ $t("+select.hasNoSelect") }}</span>
                    <div class="flex justify-between gap-4">
                        <span class="text-sm text-base-content/70">
                            {{ $t("+select.selectedEnCount", { count: selectedEnData.length }) }}
                        </span>
                        <span class="text-sm text-base-content/70">
                            {{ $t("+select.selectedCnCount", { count: selectedCnData.length }) }}
                        </span>
                    </div>
                </div>
                <div class="join">
                    <button
                        class="join-item btn btn-outline btn-secondary"
                        :disabled="!workbooks || !workbooks.sheets || workbooks.sheets.length === 0"
                        @click="setEnData">
                        {{ $t("+select.setEnButton") }}
                    </button>
                    <button
                        class="join-item btn btn-outline btn-accent"
                        :disabled="!workbooks || !workbooks.sheets || workbooks.sheets.length === 0"
                        @click="setCnData">
                        {{ $t("+select.setCnButton") }}
                    </button>
                    <button
                        class="join-item btn btn-outline btn-success"
                        :disabled="selectedEnData.length === 0 || selectedCnData.length === 0"
                        @click="sendSelectedData">
                        {{ $t("+select.confirmButton") }}
                    </button>
                </div>
            </div>

            <div v-if="workbooks?.sheets?.length > 0" class="tabs tabs-lift w-full mt-4">
                <template v-for="(sheet, sheetIndexF) in workbooks.sheets" :key="sheetIndex">
                    <input
                        type="radio"
                        name="my_tabs_3"
                        class="tab"
                        :aria-label="decodeHtmlEntities(sheet.name)"
                        :checked="sheetIndex === sheetIndexF"
                        @click="sheetIndex = sheetIndexF" />
                    <div class="tab-content bg-base-100 border-base-300 p-6">
                        <ScrollContainer class="max-h-[calc(100vh-289px)]" @mouseup="endDrag" @mouseleave="endDrag">
                            <table
                                class="table table-zebra"
                                style="--color-base-200: color-mix(in oklch, black 7%, transparent)">
                                <thead>
                                    <tr>
                                        <th class="w-5"></th>
                                        <th
                                            v-for="colIndex in sheet.rows[0].length"
                                            :key="colIndex"
                                            @mousedown.prevent="startDragCol(sheetIndexF, colIndex - 1)"
                                            @mouseenter="dragOverCell(sheetIndexF, 0, colIndex - 1)"
                                            class="cursor-pointer">
                                            {{ numberToColumn(colIndex) }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, rowIndex) in sheet.rows" :key="rowIndex">
                                        <td
                                            @mousedown.prevent="startDragRow(sheetIndexF, rowIndex)"
                                            @mouseenter="dragOverCell(sheetIndexF, rowIndex, 0)"
                                            class="cursor-pointer">
                                            {{ rowIndex + 1 }}
                                        </td>
                                        <td
                                            v-for="(cell, colIndex) in row"
                                            :key="colIndex"
                                            @mousedown.prevent="startDragCell(sheetIndexF, rowIndex, colIndex)"
                                            @mouseenter="dragOverCell(sheetIndexF, rowIndex, colIndex)"
                                            class="cursor-pointer"
                                            :style="{
                                                boxShadow: getCellBoxShadow(sheetIndexF, rowIndex, colIndex),
                                                backgroundColor: cell.style.bg_color || 'transparent',
                                                color: cell.style.fg_color || 'currentColor',
                                                fontSize: cell.style.font_size * 1.05 + 'px' || '14px',
                                                fontWeight: cell.style.bold ? 'bold' : 'normal',
                                                fontStyle: cell.style.italic
                                                    ? 'italic'
                                                    : cell.style.underline
                                                    ? 'underline'
                                                    : 'normal',
                                            }">
                                            {{ cell.value.String }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </ScrollContainer>
                    </div>
                </template>
            </div>
            <div v-else class="w-full h-full my-4 flex flex-col justify-center items-center">
                <span class="opacity-25">{{ $t("+select.placeHolder") }}</span>
            </div>
        </main>
        <MyFooter />
        <ToastController ref="toastController" />
    </div>
</template>

<style scoped>
    .mygrid {
        display: grid;
        grid-template-rows: calc(var(--spacing) * 12) 1fr calc(var(--spacing) * 12);
        grid-template-columns: 1fr;
        height: 100%;
    }

    td {
        border: none;
    }
</style>
