import CampThemeProvider from '@/components/camp/camp-theme-provider';
import type { Metadata } from "next";
import "./globals.css";
import { themeBootstrap } from '@/lib/camp-theme.mjs';

import { STYLE_FILES } from '@/lib/camp-style-files.mjs';

export const metadata: Metadata = {
  title: "허들러즈 불멍 · Huddlers Fire",
  description: "오늘도 잠시 불멍하고 갈까요. 최대 16명의 친구들과 함께하는 작은 숲속 쉼터.",
  icons: {
    icon: STYLE_FILES['camp-icon'].url,
    shortcut: STYLE_FILES['camp-icon'].url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-camp-theme="color" data-theme="light" data-astryx-theme="neutral" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }}/></head>
      <body className="antialiased"><CampThemeProvider>{children}</CampThemeProvider></body>
    </html>
  );
}
