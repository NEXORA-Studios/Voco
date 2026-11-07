import { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { useSessionStore } from "@/store/session.store";
import { usePackagesStore } from "@/store/packages.store";
import { useSettingsStore } from "@/store/settings.store";
import { DEFAULT_SESSION_DISPLAY_SETTINGS } from "@/features/session/display";
import type { SessionDisplaySettings } from "@/types/global.d.ts";
import { VocabRoulette } from "@/features/session/components/VocabRoulette";
import { VocabCard } from "@/features/session/components/VocabCard";
import { SessionControls } from "@/features/session/components/SessionControls";
import { PickerButton } from "@/components/PickerButton";

const SPIN_DURATION = 2500;

export function Session() {
    const { slug } = useParams<{ slug: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { packages, loaded, load } = usePackagesStore();
    const { settings, loaded: settingsLoaded, load: loadSettings } = useSettingsStore();
    const location = useLocation();
    const displayOverride = (location.state as { sessionDisplayOverride?: SessionDisplaySettings } | null)
        ?.sessionDisplayOverride;
    const launchId = location.key;
    const { pkg, state, display, displayDefaults, sessionLaunchId, init, setMode, setDisplay, applyDisplayOverride, stop } =
        useSessionStore();
    const isSameActiveSession = pkg?.slug === slug && state.status !== "done";
    const sessionDisplay =
        displayOverride ??
        (isSameActiveSession ? displayDefaults : (settings?.session_display ?? DEFAULT_SESSION_DISPLAY_SETTINGS));

    useEffect(() => {
        if (!loaded) load();
    }, [loaded, load]);

    useEffect(() => {
        if (!settingsLoaded) void loadSettings();
    }, [settingsLoaded, loadSettings]);

    useEffect(() => {
        if (loaded && settingsLoaded && slug) {
            const found = packages.find((p) => p.slug === slug || p.id === slug);
            if (!found) return;

            const mode = "both" as const;

            if (!pkg || pkg.slug !== found.slug || pkg.id !== found.id || state.status === "done") {
                init(found, mode, sessionDisplay, displayOverride ? launchId : null);
            } else {
                setMode(mode);
                if (displayOverride && sessionLaunchId !== launchId) {
                    applyDisplayOverride(sessionDisplay, launchId);
                }
                const imageMethod = displayDefaults.image ? "right" : displayDefaults.image_method;
                if (display.image_method !== imageMethod) {
                    setDisplay({ image_method: imageMethod });
                }
            }
        }
    }, [
        loaded,
        settingsLoaded,
        slug,
        packages,
        pkg,
        display.image_method,
        displayDefaults,
        sessionLaunchId,
        init,
        setMode,
        setDisplay,
        applyDisplayOverride,
        state.status,
        sessionDisplay,
        launchId,
        displayOverride,
    ]);

    // Auto-stop spinner after 5 seconds
    useEffect(() => {
        if (state.status === "spinning") {
            const timer = setTimeout(() => stop(), SPIN_DURATION);
            return () => clearTimeout(timer);
        }
    }, [state.status, stop]);

    if (!pkg) {
        return (
            <div className="flex max-h-svh items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="relative flex h-svh flex-col overflow-hidden">
            <Button variant="ghost" size="icon" className="absolute top-4 left-4 z-10" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-auto p-6 pb-24">
                {state.status === "spinning" && <VocabRoulette />}
                {(state.status === "paused" || state.status === "revealed") && <VocabCard />}
                {state.status === "done" && (
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-3xl font-bold">{t("session.done")}</h2>
                    </div>
                )}
            </div>

            <SessionControls />

            <PickerButton />
        </div>
    );
}
