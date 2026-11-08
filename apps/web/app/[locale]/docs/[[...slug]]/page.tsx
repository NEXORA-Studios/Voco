import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MarkdownContent } from "@/components/docs/MarkdownContent";
import { getDoc, getDocs, getDocHeadings, getDocPath, getDocSlugs } from "@/lib/docs";
import type { Locale } from "@/i18n/config";

export async function generateStaticParams() {
    return ["en-GB", "en-US", "zh-CN", "zh-TW"].flatMap((locale) =>
        getDocSlugs().map((slug) => ({ locale, slug: slug === "index" ? [] : [slug] }))
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale; slug?: string[] }>;
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const doc = getDoc(locale, slug);
    return doc ? { title: `${doc.title} · Voco Docs`, description: doc.description } : {};
}

export default async function DocsPage({ params }: { params: Promise<{ locale: Locale; slug?: string[] }> }) {
    const { locale, slug } = await params;
    const doc = getDoc(locale, slug);
    if (!doc) notFound();
    const docs = getDocs(locale);
    const t = await getTranslations();
    const headings = await getDocHeadings(doc.content);
    const currentIndex = docs.findIndex((item) => item.slug === doc.slug);
    const previous = docs[currentIndex - 1];
    const next = docs[currentIndex + 1];

    return (
        <div className="min-h-[calc(100vh-9rem)] bg-muted/20">
            <div className="container mx-auto grid max-w-[1500px] gap-10 px-4 py-10 lg:grid-cols-[260px_minmax(0,1fr)_260px] lg:gap-12 lg:py-14">
                <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto lg:block">
                    <div>
                        <div className="mb-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{t("docs.contents")}</div>
                        <nav className="space-y-1 border-l pl-4">
                            {docs.map((item, index) => (
                                <div key={item.slug}>
                                    {(index === 0 || item.folder.join("/") !== docs[index - 1].folder.join("/")) && item.folder.length > 0 ? (
                                        <div className="px-3 pb-1 pt-4 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{item.folder.join(" / ")}</div>
                                    ) : null}
                                    <Link
                                        href={getDocPath(item) as "/docs"}
                                        className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${item.slug === doc.slug ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"}`}>
                                        {item.title}
                                    </Link>
                                </div>
                            ))}
                        </nav>
                    </div>
                </aside>
                <main className="min-w-0 rounded-2xl border bg-background p-6 shadow-sm sm:p-10">
                    <div className="mb-8 flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-primary uppercase">
                        <FileText className="h-4 w-4" /> {t("docs.badge")}
                    </div>
                    <MarkdownContent source={doc.content} locale={locale} />
                    <div className="mt-14 grid gap-3 border-t pt-6 sm:grid-cols-2">
                        {previous ? (
                            <Link
                                href={getDocPath(previous) as "/docs"}
                                className="group rounded-xl border p-4 transition-colors hover:border-primary">
                                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <ArrowLeft className="h-3 w-3" /> {t("docs.previous")}
                                </span>
                                <span className="mt-1 block font-medium group-hover:text-primary">{previous.title}</span>
                            </Link>
                        ) : (
                            <span />
                        )}
                        {next ? (
                            <Link
                                href={getDocPath(next) as "/docs"}
                                className="group rounded-xl border p-4 text-right transition-colors hover:border-primary">
                                <span className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                    {t("docs.next")} <ArrowRight className="h-3 w-3" />
                                </span>
                                <span className="mt-1 block font-medium group-hover:text-primary">{next.title}</span>
                            </Link>
                        ) : null}
                    </div>
                </main>
                <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] self-start overflow-y-auto lg:block">
                    <div>
                        <div className="rounded-xl border bg-background/60 p-4 text-xs text-muted-foreground">
                            <p className="mb-3 font-semibold text-foreground">{t("docs.contents")}</p>
                            <nav className="space-y-1 border-l">
                                {headings.map((heading) => (
                                    <a key={heading.id} href={`#${heading.id}`} className={`block border-l-2 py-1.5 pr-2 transition-colors hover:border-primary hover:text-primary ${heading.level === 1 ? "-ml-px pl-3 font-medium text-foreground" : "pl-5"}`}>
                                        {heading.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                        <div className="mt-4 rounded-xl border bg-background/60 p-4 text-xs text-muted-foreground">
                            <p className="mb-2 font-semibold text-foreground">{t("docs.tipTitle")}</p>
                            <p>{t("docs.tip")}</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

