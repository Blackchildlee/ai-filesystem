import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI File System",
  description: "Intelligent file management with semantic search and AI-powered organization",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1d21" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
