'use client';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { useCampSettings } from './use-camp-settings';

export default function CampThemeProvider({children}: {children: React.ReactNode}) {
  const [settings] = useCampSettings();
  return <Theme theme={neutralTheme} mode={settings.theme === 'dark' ? 'dark' : 'light'}>{children}</Theme>;
}
