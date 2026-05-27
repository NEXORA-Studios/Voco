import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Download, Home } from "lucide-react";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { ThemeToggle } from "../components/ThemeToggle";

export const Route = createRootRoute({
    component: RootComponent,
});

function RootComponent() {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link to="/" className="text-xl font-bold">
                        Voco
                    </Link>
                    <nav className="flex items-center gap-2">
                        <Link to="/">
                            <Button variant="ghost" size="sm">
                                <Home className="mr-2 h-4 w-4" />
                                {t("nav.home")}
                            </Button>
                        </Link>
                        <Link to="/downloads">
                            <Button variant="ghost" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                {t("nav.downloads")}
                            </Button>
                        </Link>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                <Outlet />
            </main>
            <footer className="border-t">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("footer.copyright")}
                </div>
            </footer>
        </div>
    );
}

