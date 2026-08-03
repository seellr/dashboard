import type { Metadata } from "next";
import "@fontsource/alexandria/400.css";
import "@fontsource/alexandria/500.css";
import "@fontsource/alexandria/600.css";
import "@fontsource/alexandria/700.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "ME.INC / Seellr Admin Panel",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  return (
    // lang and dir are overridden by the [locale] layout via suppressHydrationWarning
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
