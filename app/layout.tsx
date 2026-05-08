import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Insito CRM",
  description: "CRM voor Insito Payroll",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
