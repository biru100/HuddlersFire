import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "허들러즈 불멍 · Huddlers Fire",
  description: "오늘도 잠시 불멍하고 갈까요. 최대 16명의 친구들과 함께하는 작은 숲속 쉼터.",
  icons: {
    icon: "/camp-icon.svg",
    shortcut: "/camp-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
