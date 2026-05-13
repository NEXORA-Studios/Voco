import { HashRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Settings, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Home } from "@/routes/home";
import { PackageNew } from "@/routes/package-new";
import { PackageEdit } from "@/routes/package-edit";
import { Session } from "@/routes/session";
import { Picker } from "@/routes/picker";
import { SettingsPage } from "@/routes/settings";
import { UpdateNotification } from "@/features/settings/components/UpdateNotification";
import { Bridge, type UpdateInfo } from "@/lib/bridge";

function Sidebar() {
    const { t } = useTranslation();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

    const mainLinks = [{ to: "/", icon: BookOpen, label: t("app.home") }];

    const bottomLinks = [{ to: "/settings", icon: Settings, label: t("app.settings") }];

    useEffect(() => {
        // 静默检查更新（启动时）
        const checkUpdateSilently = async () => {
            try {
                const info = await Bridge.updater.check();
                if (info.available) {
                    setUpdateInfo(info);
                }
            } catch (e) {
                // 静默失败，不显示错误
                console.log("Update check failed silently:", e);
            }
        };
        checkUpdateSilently();
    }, []);

    if (location.pathname.startsWith("/session") || location.pathname.startsWith("/picker")) return null;

    return (
        <div>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 lg:hidden" onClick={() => setOpen(!open)}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}>
                <div className="flex h-full flex-col p-4">
                    <div className="mb-6 flex items-center gap-2 px-2">
                        <img src="/logo.png" alt={t("app.title")} className="size-8" />
                        <span className="text-lg font-bold">{t("app.title")}</span>
                    </div>
                    <nav className="flex flex-1 flex-col gap-1">
                        {mainLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                    location.pathname === link.to ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                }`}>
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    {updateInfo && <UpdateNotification updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />}
                    <nav className="flex flex-col gap-1 border-t pt-4">
                        {bottomLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                                    location.pathname === link.to ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                                }`}>
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </aside>
            {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
        </div>
    );
}

function Layout() {
    const location = useLocation();
    const noSidebar = location.pathname.startsWith("/session") || location.pathname.startsWith("/picker");

    return (
        <div className={`${noSidebar ? "h-svh overflow-hidden" : "min-h-svh"} ${noSidebar ? "" : "lg:pl-64"}`}>
            <Sidebar />
            <main className={`p-6 ${noSidebar ? "p-0" : ""}`}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/packages/new" element={<PackageNew />} />
                    <Route path="/packages/:slug/edit" element={<PackageEdit />} />
                    <Route path="/session/:slug" element={<Session />} />
                    <Route path="/picker" element={<Picker />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Routes>
            </main>
        </div>
    );
}

export function App() {
    return (
        <HashRouter>
            <Layout />
        </HashRouter>
    );
}
