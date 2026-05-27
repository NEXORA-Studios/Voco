"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Button } from "@workspace/shadcn-ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/shadcn-ui/components/dropdown-menu";
import { Globe } from "lucide-react";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
    const t = useTranslations();
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    const pushToNewHref = (code: string) => {
        router.push(`/${code}/${pathname.split("/").slice(2).join("/")}`);
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Globe className="mr-2 h-4 w-4" />
                    {t(`language.${locale}`)}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {routing.locales.map((code) => (
                    <DropdownMenuItem key={code} onClick={() => pushToNewHref(code)}>
                        {t(`language.${code}`)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

