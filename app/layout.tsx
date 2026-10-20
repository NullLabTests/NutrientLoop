import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutrientLoop - Document Intelligence Pipeline",
  description: "Document processing with Nutrient DWS APIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
