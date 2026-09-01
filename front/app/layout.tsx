import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "صالة الحافظ — أجهزة  كهربائية أصلية",
    template: "%s | صالة الحافظ"
  },
  description: "صالة الحافظ للقطع الكهربائية الأصلية — قواطع، أسلاك، إضاءة، لوحات توزيع من أفضل الماركات العالمية بضمان المصنع.",
  applicationName: "صالة الحافظ",
  keywords: ["صالة الحافظ", "أجهزة كهربائية", "قواطع", "لوحات توزيع", "إضاءة", "أسلاك"],
  authors: [{ name: "صالة الحافظ" }],
  openGraph: {
    title: "صالة الحافظ — خيارك الأول للقطع الكهربائية",
    description: "نوفر أفضل الماركات العالمية للقطع الكهربائية والمنزلية بضمان المصنع.",
    url: "https://alhafez-center.com",
    siteName: "صالة الحافظ",
    locale: "ar_SA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
