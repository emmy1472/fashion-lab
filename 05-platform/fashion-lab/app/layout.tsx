import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fashion-Lab — Professional Fashion Technology Platform",
  description: "All-in-one digital fashion studio, made-to-measure patterns, and production platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Manrope:wght@600;700&family=Montserrat:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-ink selection:bg-brand/20 selection:text-brand">
        {children}
      </body>
    </html>
  );
}
