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
      <body className="min-h-full flex flex-col bg-[#F8F9FA] text-[#111827]">
        {children}
      </body>
    </html>
  );
}
