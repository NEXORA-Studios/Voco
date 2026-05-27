import { NextResponse } from "next/server";
import { getLatestRelease } from "@/lib/github";

export async function GET() {
    try {
        const data = await getLatestRelease();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch GitHub release:", error);
        return NextResponse.json(
            { error: "Failed to fetch release data" },
            { status: 500 }
        );
    }
}
