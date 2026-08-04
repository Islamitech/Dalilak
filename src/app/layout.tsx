import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "نظام توثيق الأماكن التجارية الميداني",
  description: "منصة الموثقين الميدانيين لتسجيل وإضافة الأماكن التجارية غير المدرجة على خرائط جوجل",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} h-full antialiased`}
    >
      <body className={`${cairo.className} min-h-full flex flex-col bg-slate-50 text-slate-900`}>
        {children}
      </body>
    </html>
  );
}
