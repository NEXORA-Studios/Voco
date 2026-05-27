import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/shadcn-ui/components/card";
import { Badge } from "@workspace/shadcn-ui/components/badge";
import { Download, Sparkles, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/")({
    component: LandingPage,
});

function LandingPage() {
    const { t } = useTranslation();

    const features = [
        {
            icon: <BookOpen className="h-6 w-6" />,
            title: t("landing.features.vocabManagement.title"),
            description: t("landing.features.vocabManagement.description"),
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: t("landing.features.classroomChallenge.title"),
            description: t("landing.features.classroomChallenge.description"),
        },
        {
            icon: <Sparkles className="h-6 w-6" />,
            title: t("landing.features.randomPicker.title"),
            description: t("landing.features.randomPicker.description"),
        },
    ];

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32">
                <div className="container mx-auto px-4 text-center">
                    <Badge variant="secondary" className="mb-4">
                        {t("landing.badge")}
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
                        {t("landing.title")}
                        <span className="text-primary"> {t("landing.titleHighlight")}</span>
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
                        {t("landing.description")}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/downloads">
                            <Button size="lg">
                                <Download className="mr-2 h-5 w-5" />
                                {t("landing.downloadNow")}
                            </Button>
                        </Link>
                        <Link to="/about">
                            <Button variant="outline" size="lg">
                                {t("landing.learnMore")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-muted/50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">{t("landing.features.title")}</h2>
                        <p className="text-muted-foreground">{t("landing.features.subtitle")}</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        {feature.icon}
                                    </div>
                                    <CardTitle>{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-4 text-3xl font-bold">{t("landing.cta.title")}</h2>
                    <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
                        {t("landing.cta.description")}
                    </p>
                    <Link to="/downloads">
                        <Button size="lg">
                            <Download className="mr-2 h-5 w-5" />
                            {t("landing.cta.button")}
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
