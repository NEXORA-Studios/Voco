<script setup lang="ts">
    import { useI18n } from "vue-i18n";
    const { t } = useI18n();
</script>

<template>
    <footer class="h-full footer footer-center bg-base-200 text-base-content border-t border-base-content/25">
        <section class="flex flex-row gap-1">
            <span>
                {{
                    t("footer.copyright1", {
                        year: new Date().getFullYear() == 2025 ? "" : `~${new Date().getFullYear()}`,
                    })
                }}
            </span>
            <img src="/nexora-studios.png" alt="NEXORA Studios" class="h-3 translate-y-[0.5px]" />
            <span>{{ t("footer.copyright2") }}</span>
        </section>
    </footer>
</template>
