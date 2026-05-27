import { unstable_cache } from "next/cache";

const GITHUB_API_URL = "https://api.github.com/repos/NEXORA-Studios/Voco/releases/latest";

async function fetchLatestRelease() {
    const response = await fetch(GITHUB_API_URL, {
        headers: {
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 300 },
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const getLatestRelease = unstable_cache(
    async () => fetchLatestRelease(),
    ["github", "latest-release"],
    { revalidate: 300 }
);
