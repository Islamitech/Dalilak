import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B1120",
};

export const metadata: Metadata = {
  title: "دليلك للخدمات الرقمية — توثيق الخرائط",
  description: "المنظومة الرقمية الشاملة للتحول الرقمي، التوثيق الميداني الذكي، وإدارة المنشآت والحلول المتقدمة للأعمال",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "دليلك",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#0B1120",
    "background-color": "#0B1120",
  },
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
      <head>
        <meta name="theme-color" content="#0B1120" />
        <meta name="background-color" content="#0B1120" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={`${cairo.className} min-h-full flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
