// Render-only conversion also supports colored profiles from an older room/session.
// Shared profile data and wire contracts stay compatible. External images are untouched.
const tones = new Map();
export function monochrome(value) {
  if (typeof value !== 'string' || !/^#[\da-f]{3,8}$/i.test(value)) return '#b8b8b8';
  if (tones.has(value)) return tones.get(value);
  let hex=value.slice(1);
  if(hex.length===3||hex.length===4)hex=[...hex].map(c=>c+c).join('');
  if(hex.length!==6&&hex.length!==8)return '#b8b8b8';
  const [r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
  const gray=Math.round(.2126*r+.7152*g+.0722*b).toString(16).padStart(2,'0');
  const result='#'+gray.repeat(3)+hex.slice(6);
  if(tones.size>=128)tones.clear();tones.set(value,result);return result;
}
export const CHARACTER_COLORS = ['#dc754d','#399d88','#4e8dcc','#ab7bc2','#d4a53c','#df889f'];
export const COLOR_LABELS = ['테라코타','민트','하늘','라벤더','해바라기','로즈'];
// Gray profile slots are stable IDs; colorful legacy profiles retain their original color.
export function characterColor(value, theme = 'color') {
  if (theme === 'dark') return monochrome(value);
  if (typeof value !== 'string' || !/^#([\da-f]{3}|[\da-f]{6})$/i.test(value)) return CHARACTER_COLORS[0];
  const hex=value.length===4?'#'+[...value.slice(1)].map(c=>c+c).join(''):value;
  return hex.slice(1,3)===hex.slice(3,5)&&hex.slice(3,5)===hex.slice(5,7) ? CHARACTER_COLORS[toneIndex(value)] : value;
}
export const TONE_LABELS=['차콜','그라파이트','스톤','실버','미스트','화이트'];
export const TONE_MARKS=['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ'];
export function toneIndex(color) {
  const level=parseInt(monochrome(color).slice(1,3),16);
  return Math.max(0,Math.min(5,Math.round((level-96)/30)));
}
export const portalMark=destination=>destination==='playground'?'△':destination==='showroom'?'□':'○';
