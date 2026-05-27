import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/shadcn-ui/components/dropdown-menu";
import { Globe } from "lucide-react";

const languages = [
    { code: "zh-CN", key: "zh-CN" },
    { code: "zh-TW", key: "zh-TW" },
    { code: "en-US", key: "en-US" },
    { code: "en-GB", key: "en-GB" },
];

export function LanguageSwitcher() {
    const { i18n, t } = useTranslation();

    const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Globe className="mr-2 h-4 w-4" />
                    {t(`language.${currentLanguage.key}`)}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
                        {t(`language.${lang.key}`)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
