"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BookOpen, Users, Sparkles, Download } from "lucide-react";
import { Badge } from "@workspace/shadcn-ui/components/badge";
import { Button } from "@workspace/shadcn-ui/components/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@workspace/shadcn-ui/components/card";
import { default as RotatingText } from "@workspace/shadcn-ui/components/RotatingText";
import { MotionSection, MotionStagger, MotionItem } from "@/components/motion";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function LandingPage() {
    const t = useTranslations();
    const locale = useLocale();

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
            <section className="relative -top-16 flex h-svh flex-col items-center justify-center">
                <div className="container mx-auto w-full px-4">
                    <div className="grid items-center gap-x-20 lg:grid-cols-2">
                        {/* Left Content */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}>
                                <Badge variant="secondary" className="mb-4">
                                    {t("landing.badge")}
                                </Badge>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.1 }}
                                className="mb-6 flex flex-wrap items-center gap-4">
                                <motion.h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                                    {t("landing.title")}
                                </motion.h1>
                                <RotatingText
                                    texts={[
                                        t("landing.titleHighlight.1"),
                                        t("landing.titleHighlight.2"),
                                        t("landing.titleHighlight.3"),
                                        t("landing.titleHighlight.4"),
                                    ]}
                                    // mainClassName="text-4xl md:text-6xl font-bold tracking-tight text-primary-foreground "
                                    mainClassName="text-4xl font-bold tracking-tight md:text-6xl px-2 md:px-3 bg-primary text-primary-foreground w-fit transition-width duration-300 ease-in-out py-0.5 sm:py-1 md:py-2 rounded-lg"
                                    staggerFrom="first"
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "-120%" }}
                                    staggerDuration={0.025}
                                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1"
                                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                                    rotationInterval={3000}
                                    splitBy="characters"
                                    auto
                                    loop
                                />
                            </motion.div>

                            <motion.p
                                className="mb-8 max-w-xl text-lg text-muted-foreground md:text-xl"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.2 }}>
                                {t("landing.description")}
                            </motion.p>

                            <motion.div
                                className="flex flex-wrap gap-4"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, delay: 0.3 }}>
                                <Link href="/downloads">
                                    <Button size="lg">
                                        <Download className="mr-2 h-5 w-5" />
                                        {t("landing.downloadNow")}
                                    </Button>
                                </Link>

                                <Link href="/about">
                                    <Button variant="outline" size="lg">
                                        {t("landing.learnMore")}
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Right Preview */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: 60 }}
                            animate={{ opacity: 1, scale: 1, x: 20 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative rotate-3">
                            <div className="aspect-video rounded-sm border bg-muted shadow-2xl">
                                {/* Product Image */}
                                <Image
                                    width={1920}
                                    height={1080}
                                    priority
                                    src={`/images/product-preview-${locale}.png`}
                                    alt="Voco Preview"
                                    className="pointer-events-none h-full w-full object-cover"
                                    // style={{ clipPath: "inset(1px 1px 2px 2px)" }}
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <MotionSection className="bg-muted/50 py-20">
                <div className="container mx-auto px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 text-3xl font-bold">{t("landing.features.title")}</h2>
                        <p className="text-muted-foreground">{t("landing.features.subtitle")}</p>
                    </div>
                    <MotionStagger className="grid gap-6 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <MotionItem key={index}>
                                <Card className="h-full transition-all hover:shadow-lg">
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
                            </MotionItem>
                        ))}
                    </MotionStagger>
                </div>
            </MotionSection>

            {/* CTA Section */}
            <MotionSection className="py-20" delay={0.2}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="mb-4 text-3xl font-bold">{t("landing.cta.title")}</h2>
                    <p className="mx-auto mb-8 max-w-xl text-muted-foreground">{t("landing.cta.description")}</p>
                    <Link href="/downloads">
                        <Button size="lg">
                            <Download className="mr-2 h-5 w-5" />
                            {t("landing.cta.button")}
                        </Button>
                    </Link>
                </div>
            </MotionSection>
        </div>
    );
}

