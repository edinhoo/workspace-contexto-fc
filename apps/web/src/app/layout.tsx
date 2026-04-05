import type { Metadata } from "next";
import { Sora } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

export const metadata: Metadata = {
  title: "Contexto FC Web",
  description: "Web app inicial sobre a data-api do Contexto FC"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={sora.variable}>{children}</body>
    </html>
  );
}
