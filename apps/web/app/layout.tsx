import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ThemeProvider";

import "@workspace/shadcn-ui/styles/globals.css";
import "@workspace/shadcn-ui/styles/website.css";

export const metadata: Metadata = {
    title: "Voco - Vocabulary Learning",
    description: "A powerful vocabulary learning application",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} className="h-full antialiased">
            <body>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider>{children}</ThemeProvider>
                </NextIntlClientProvider>
                <Analytics />
            </body>
        </html>
    );
}

