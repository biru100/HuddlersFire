// Local presentation preference. Never include this value in room snapshots.
export const normalizeTheme = value => value === 'dark' ? 'dark' : 'color';

// Kept self-contained so the same implementation can run before the first paint.
export function applyTheme(doc, value) {
  const theme = value === 'dark' ? 'dark' : 'color';
  const root = doc.documentElement;
  root.dataset.campTheme = theme;
  root.dataset.seedColorMode = theme === 'dark' ? 'dark-only' : 'light-only';
  root.dataset.seedUserColorScheme = theme === 'dark' ? 'dark' : 'light';
}

export const themeBootstrap = `(${applyTheme.toString()})(document,(()=>{try{return JSON.parse(localStorage.getItem('huddlers-fire-settings'))?.theme}catch{return 'color'}})());`;
