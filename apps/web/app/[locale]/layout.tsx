import { ClientLayout } from "@/components/ClientLayout";

export default function LocaleLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <ClientLayout>{children}</ClientLayout>;
}
