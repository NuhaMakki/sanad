import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سند — منصة خدمة طلاب جامعة الإمام",
  description: "منصة سند لخدمة طلاب جامعة الإمام محمد بن سعود الإسلامية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
