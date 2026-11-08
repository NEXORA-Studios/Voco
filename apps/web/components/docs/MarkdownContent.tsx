import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import type { ComponentProps } from "react";
import { remarkHeadingIds } from "@/lib/markdown-headings";
import remarkGfm from "remark-gfm";

type Components = NonNullable<MDXRemoteProps["components"]>;

function H1({ children, ...props }: ComponentProps<"h1">) {
    return <h1 {...props} className="mt-2 mb-5 scroll-mt-24 text-3xl font-semibold tracking-tight">{children}</h1>;
}
function H2({ children, ...props }: ComponentProps<"h2">) {
    return <h2 {...props} className="mt-10 mb-3 scroll-mt-24 text-xl font-semibold tracking-tight">{children}</h2>;
}
function H3({ children, ...props }: ComponentProps<"h3">) {
    return <h3 {...props} className="mt-7 mb-2 scroll-mt-24 text-base font-semibold">{children}</h3>;
}
function Paragraph({ children, ...props }: ComponentProps<"p">) {
    return <p {...props} className="my-5 leading-7 text-muted-foreground">{children}</p>;
}
function UnorderedList({ children, ...props }: ComponentProps<"ul">) {
    return <ul {...props} className="my-5 list-disc space-y-2 pl-6 text-muted-foreground">{children}</ul>;
}
function OrderedList({ children, ...props }: ComponentProps<"ol">) {
    return <ol {...props} className="my-5 list-decimal space-y-2 pl-6 text-muted-foreground">{children}</ol>;
}
function Quote({ children, ...props }: ComponentProps<"blockquote">) {
    return <blockquote {...props} className="my-6 border-l-2 border-primary pl-5 text-muted-foreground">{children}</blockquote>;
}
function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
    return (
        <pre
            {...props}
            className="my-6 overflow-x-auto rounded-xl border bg-zinc-950 p-4 text-sm leading-6 text-zinc-100 shadow-sm [&_code]:!rounded-none [&_code]:!bg-transparent [&_code]:!px-0 [&_code]:!py-0 [&_code]:!text-inherit [&_code]:whitespace-pre">
            {children}
        </pre>
    );
}
function InlineCode({ children, ...props }: ComponentProps<"code">) {
    return <code {...props} className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">{children}</code>;
}

function createComponents(locale: string): Components {
    return {
        h1: H1,
        h2: H2,
        h3: H3,
        p: Paragraph,
        ul: UnorderedList,
        ol: OrderedList,
        blockquote: Quote,
        pre: CodeBlock,
        code: InlineCode,
        a: ({ href = "", children, ...props }: ComponentProps<"a">) => {
            const localizedHref = href.startsWith("/") && !href.startsWith(`/${locale}/`) ? `/${locale}${href}` : href;
            return <Link href={localizedHref as ComponentProps<typeof Link>["href"]} {...props} className="font-medium text-primary underline underline-offset-4">{children}</Link>;
        },
        table: ({ children, ...props }: ComponentProps<"table">) => <div className="my-6 overflow-x-auto"><table {...props} className="w-full border-collapse text-left text-sm">{children}</table></div>,
        th: ({ children, ...props }: ComponentProps<"th">) => <th {...props} className="border-b px-3 py-2 font-semibold">{children}</th>,
        td: ({ children, ...props }: ComponentProps<"td">) => <td {...props} className="border-b px-3 py-2 text-muted-foreground">{children}</td>,
    };
}

export function MarkdownContent({ source, locale }: { source: string; locale: string }) {
    return (
        <div className="docs-content">
            <MDXRemote source={source} components={createComponents(locale)} options={{ mdxOptions: { remarkPlugins: [remarkGfm, remarkHeadingIds] } }} />
        </div>
    );
}
