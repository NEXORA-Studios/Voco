import { HashRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, Dices, Settings, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Home } from "@/routes/home";
import { PackageNew } from "@/routes/package-new";
import { PackageEdit } from "@/routes/package-edit";
import { Session } from "@/routes/session";
import { Picker } from "@/routes/picker";
import { SettingsPage } from "@/routes/settings";

function Sidebar() {
    const { t } = useTranslation();
    const location = useLocation();
    const [open, setOpen] = useState(false);

    const links = [
        { to: "/", icon: BookOpen, label: t("app.home") },
        { to: "/picker", icon: Dices, label: t("app.picker") },
        { to: "/settings", icon: Settings, label: t("app.settings") },
    ];

    if (location.pathname.startsWith("/session")) return null;

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
                        <BookOpen className="h-6 w-6" />
                        <span className="text-lg font-bold">{t("app.title")}</span>
                    </div>
                    <nav className="flex flex-col gap-1">
                        {links.map((link) => (
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
    const isSession = location.pathname.startsWith("/session");

    return (
        <div className={`${isSession ? "h-svh overflow-hidden" : "min-h-svh"} ${isSession ? "" : "lg:pl-64"}`}>
            <Sidebar />
            <main className={`p-6 ${isSession ? "p-0" : ""}`}>
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
