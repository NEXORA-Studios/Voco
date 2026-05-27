"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/shadcn-ui/components/card";
import { Badge } from "@workspace/shadcn-ui/components/badge";
import { Download, Heart, Code, Users, Globe, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MotionSection, MotionStagger, MotionItem } from "@/components/motion";

export default function AboutPage() {
    const t = useTranslations();

    const highlights = [
        {
            icon: <Zap className="h-6 w-6" />,
            title: t("about.highlights.efficient.title"),
            description: t("about.highlights.efficient.description"),
        },
        {
            icon: <Globe className="h-6 w-6" />,
            title: t("about.highlights.multilingual.title"),
            description: t("about.highlights.multilingual.description"),
        },
        {
            icon: <Heart className="h-6 w-6" />,
            title: t("about.highlights.free.title"),
            description: t("about.highlights.free.description"),
        },
    ];

    const team = [
        {
            icon: <Code className="h-6 w-6" />,
            title: t("about.team.development.title"),
            description: t("about.team.development.description"),
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: t("about.team.community.title"),
            description: t("about.team.community.description"),
        },
    ];

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32">
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge variant="secondary" className="mb-4">
                            {t("about.badge")}
                        </Badge>
                    </motion.div>
                    <motion.h1
                        className="mb-6 text-4xl font-bold tracking-tight md:text-6xl"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                    >
                        {t("about.title")}
                    </motion.h1>
                    <motion.p
                        className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        {t("about.description")}
                    </motion.p>
                </div>
            </section>

            {/* Highlights Section */}
            <MotionSection className="bg-muted/50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">{t("about.highlights.title")}</h2>
                        <p className="text-muted-foreground">{t("about.highlights.subtitle")}</p>
                    </div>
                    <MotionStagger className="grid gap-6 md:grid-cols-3">
                        {highlights.map((item, index) => (
                            <MotionItem key={index}>
                                <Card className="h-full transition-all hover:shadow-lg">
                                    <CardHeader>
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            {item.icon}
                                        </div>
                                        <CardTitle>{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{item.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </MotionItem>
                        ))}
                    </MotionStagger>
                </div>
            </MotionSection>

            {/* Team Section */}
            <MotionSection className="py-20" delay={0.2}>
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">{t("about.team.title")}</h2>
                        <p className="text-muted-foreground">{t("about.team.subtitle")}</p>
                    </div>
                    <MotionStagger className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
                        {team.map((item, index) => (
                            <MotionItem key={index}>
                                <Card className="h-full transition-all hover:shadow-lg">
                                    <CardHeader>
                                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            {item.icon}
                                        </div>
                                        <CardTitle>{item.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription>{item.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            </MotionItem>
                        ))}
                    </MotionStagger>
                </div>
            </MotionSection>

            {/* CTA Section */}
            <MotionSection className="bg-muted/50 py-20" delay={0.2}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-4 text-3xl font-bold">{t("about.cta.title")}</h2>
                    <p className="mx-auto mb-8 max-w-xl text-muted-foreground">{t("about.cta.description")}</p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Link href="/downloads">
                            <Button size="lg">
                                <Download className="mr-2 h-5 w-5" />
                                {t("about.cta.button")}
                            </Button>
                        </Link>
                    </motion.div>
                </div>
            </MotionSection>
        </div>
    );
}
