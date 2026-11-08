import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Locale } from "@/i18n/config";

export type Doc = {
    slug: string;
    title: string;
    description: string;
    content: string;
    folder: string[];
};

const contentRoot = path.join(process.cwd(), "content", "docs");

function listMarkdownFiles(directory: string, prefix = ""): string[] {
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) return listMarkdownFiles(path.join(directory, entry.name), relative);
        return /\.(md|mdx)$/i.test(entry.name) ? [relative.replace(/\.(md|mdx)$/i, "")] : [];
    });
}

function readDoc(locale: Locale, slug: string): Doc | null {
    const candidates = [locale, "en-GB"];
    for (const candidate of candidates) {
        const basePath = path.join(contentRoot, candidate, slug);
        const file = [".mdx", ".md"].map((extension) => `${basePath}${extension}`).find((candidatePath) => fs.existsSync(candidatePath));
        if (!file) continue;
        const parsed = matter(fs.readFileSync(file, "utf8"));
        return {
            slug,
            title: String(parsed.data.title ?? slug.split("/").at(-1) ?? slug),
            description: String(parsed.data.description ?? ""),
            content: parsed.content.trim(),
            folder: slug.split("/").slice(0, -1),
        };
    }
    return null;
}

export function getDocs(locale: Locale): Doc[] {
    return listMarkdownFiles(path.join(contentRoot, "en-GB"))
        .filter((slug) => slug !== "index")
        .map((slug) => readDoc(locale, slug))
        .filter((doc): doc is Doc => Boolean(doc));
}

export function getDoc(locale: Locale, slug?: string[]): Doc | null {
    return readDoc(locale, slug?.join("/") || "index");
}

export { getDocHeadings } from "./markdown-headings";

export function getDocPath(doc: Doc) {
    return doc.slug === "index" ? "/docs" : `/docs/${doc.slug}`;
}

export function getDocSlugs() {
    return listMarkdownFiles(path.join(contentRoot, "en-GB"));
}
