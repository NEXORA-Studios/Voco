import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { TooltipProvider } from "@workspace/shadcn-ui/components/tooltip";
import { useSettingsStore } from "@/store/settings.store";

import "@/lib/i18n";
import "@workspace/shadcn-ui/styles/globals.css";
import "@workspace/shadcn-ui/styles/app.css";

// Load settings early so language and preferences are ready before any page renders
useSettingsStore.getState().load();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <TooltipProvider>
                <App />
            </TooltipProvider>
        </ThemeProvider>
    </StrictMode>
);
