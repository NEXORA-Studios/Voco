import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Button } from "@workspace/shadcn-ui/components/button";
import { ExcelImportWizard } from "@/features/packages/components/ExcelImportWizard";

export function PackageNew() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold">{t("packages.new")}</h1>
            </div>
            <ExcelImportWizard />
        </div>
    );
}
