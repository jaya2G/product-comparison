import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Product Comparison - Compare Phones & Cameras",
  description: "Compare phones and cameras side-by-side. Find the best products with detailed specs and expert recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen flex flex-col">
            <header className="border-b">
              <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold">
                  ProductCompare
                </Link>
                <div className="flex gap-6">
                  <Link href="/products/phones" className="hover:underline">Phones</Link>
                  <Link href="/products/cameras" className="hover:underline">Cameras</Link>
                  <Link href="/assistant" className="hover:underline">Assistant</Link>
                  <Link href="/admin" className="hover:underline text-muted-foreground">Admin</Link>
                </div>
              </nav>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              © 2024 ProductCompare. All rights reserved.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
