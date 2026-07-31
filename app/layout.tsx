import type { Metadata } from "next";
import { Cairo, Roboto } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "ME.INC / Seellr Admin Panel",
};

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // lang and dir are overridden by the [locale] layout via suppressHydrationWarning
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${roboto.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
