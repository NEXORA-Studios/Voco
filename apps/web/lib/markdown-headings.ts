import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { unified } from "unified";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

type HeadingNode = {
    type: string;
    depth: number;
    children: unknown[];
    data?: { hProperties?: Record<string, unknown> };
};

export type DocHeading = {
    level: 1 | 2;
    text: string;
    id: string;
};

export function remarkHeadingIds() {
    return (tree: Parameters<ReturnType<typeof unified>['runSync']>[0]) => {
        const slugger = new GithubSlugger();
        visit(tree, "heading", (node: HeadingNode) => {
            const text = toString(node);
            node.data ??= {};
            node.data.hProperties = { ...node.data.hProperties, id: slugger.slug(text) };
        });
    };
}

export async function getDocHeadings(source: string): Promise<DocHeading[]> {
    const processor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).use(remarkHeadingIds);
    const tree = processor.parse(source);
    const transformed = await processor.run(tree);
    const headings: DocHeading[] = [];
    visit(transformed, "heading", (node: HeadingNode) => {
        if (node.depth > 2) return;
        headings.push({
            level: node.depth as 1 | 2,
            text: toString(node),
            id: String(node.data?.hProperties?.id ?? ""),
        });
    });
    return headings;
}
