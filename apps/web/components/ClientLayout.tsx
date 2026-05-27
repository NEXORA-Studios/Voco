"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DownloadIcon, HomeIcon } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const t = useTranslations();

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 border-b bg-background">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="text-xl font-bold">
                        Voco
                    </Link>
                    <nav className="flex items-center gap-2">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <HomeIcon className="mr-2 h-4 w-4" />
                                {t("nav.home")}
                            </Button>
                        </Link>
                        <Link href="/downloads">
                            <Button variant="ghost" size="sm">
                                <DownloadIcon className="mr-2 h-4 w-4" />
                                {t("nav.downloads")}
                            </Button>
                        </Link>
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </nav>
                </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t">
                <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("footer.copyright")}
                </div>
            </footer>
        </div>
    );
}

