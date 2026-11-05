import { parseYouTubeUrl } from './camp-media.mjs';
/** @typedef {{id:string,title:string,studio:string,tagline:string,description:string,details:string[],release:string,image:string,cover:string,trailer:string|null,socials:Record<string,string|null>,screenshots:string[],links:{label:string,url:string}[],source:string,checkedAt:string}} GameExhibit */
/** Shared booth/introduction template. @param {Partial<GameExhibit>} [value] @returns {GameExhibit} */
export function createGameExhibit(value={}) {
  return {id:'',title:'새 게임',studio:'',tagline:'',description:'',release:'',image:'',cover:'',trailer:null,source:'',checkedAt:'',...value,
    details:[...(value.details||[])],screenshots:[...(value.screenshots||[])],links:[...(value.links||[])],socials:{...value.socials}};
}
export const SOCIAL_CHANNELS = [
  {id:'youtube',label:'YouTube',hosts:['youtube.com','youtu.be']},
  {id:'x',label:'X',hosts:['x.com','twitter.com']},
  {id:'instagram',label:'Instagram',hosts:['instagram.com']},
  {id:'discord',label:'Discord',hosts:['discord.gg','discord.com']},
  {id:'reddit',label:'Reddit',hosts:['reddit.com']},
  {id:'tiktok',label:'TikTok',hosts:['tiktok.com']},
];
export function exhibitSocials(game) {
  return SOCIAL_CHANNELS.map(channel=>{
    let url=null;
    try{
      const value=game?.socials?.[channel.id];
      if(typeof value==='string'&&value.trim()){
        const parsed=new URL(value.trim()),host=parsed.hostname.replace(/^www\./,'');
        if(parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&!parsed.port&&channel.hosts.includes(host)&&parsed.pathname!=='/')url=parsed.href;
      }
    }catch{/* Missing or invalid account is displayed as a disabled icon. */}
    return {id:channel.id,label:channel.label,url};
  });
}
export function exhibitTrailer(game) {
  const id=parseYouTubeUrl(game?.trailer);
  return id?{id,url:'https://www.youtube.com/watch?v='+id,embed:'https://www.youtube-nocookie.com/embed/'+id+'?rel=0&playsinline=1'}:null;
}
export function exhibitCover(game) {
  const value=game?.cover||game?.image;
  return typeof value==='string'&&/^\/games\/[\w/-]+\.(?:webp|png|jpe?g)$/i.test(value)?value:null;
}
// Curated from official studio sites, Steam announcements and YouTube metadata. No runtime scraping.
export const EXHIBITED_GAMES = [createGameExhibit({
  id:'parruits', title:'PARRUITS!', studio:'Cluko',
  tagline:'과일로 변신하고, 친구들을 섬 밖으로!',
  description:'먹은 과일로 변신하는 앵무새들의 파티 난투 게임입니다. 과일마다 한 번씩 사용할 수 있는 능력을 활용해 상대를 바다로 밀어내세요.',
  details:['2~6인 파티 난투','로컬·온라인 멀티플레이','8가지 과일과 서로 다른 능력'],
  release:'2027년 1분기 Steam 얼리 액세스 예정',
  image:'/games/parruits-logo.webp',
  cover:'/games/parruits-trailer-thumbnail.jpg',
  trailer:'https://www.youtube.com/watch?v=s0pMzMwvKgE',
  socials:{youtube:'https://www.youtube.com/@PARRUITS',x:'https://x.com/clukostudio',instagram:'https://www.instagram.com/clukostudio/',discord:'https://discord.gg/kyrJjnm62h',reddit:'https://www.reddit.com/user/ClukoStudio/',tiktok:null},
  screenshots:['/games/parruits-scene.webp'],
  links:[{label:'Steam에서 찜하기',url:'https://store.steampowered.com/app/4981660/PARRUITS/?l=koreana'},{label:'공식 웹사이트',url:'https://clukostudio.com/'},{label:'프레스킷',url:'https://ndus.notion.site/parruits'}],
  source:'https://clukostudio.com/',checkedAt:'2026-11-05',
}),createGameExhibit({
  id:'torizon-telecom',title:'Torizon Telecom',studio:'SkagoGames · Project Torizon',
  tagline:'문자로 이루어진 세계, 텔레콤을 돌파하세요.',
  description:'벽과 바닥, 무기까지 문자로 이루어진 세계에서 전투를 벌이는 3D 텍스트 그래픽 FPS입니다. 언어를 바꾸면 세계의 문자도 달라지며, 다양한 무기를 활용해 텔레콤의 적들을 물리치고 나아갑니다.',
  details:['3D 텍스트 그래픽 FPS','PC · Windows','한국어 포함 다국어 지원'],
  release:'2027년 Steam 출시 예정 · 무료 데모 공개 중',
  image:'/games/torizon-telecom-logo.png',
  cover:'/games/torizon-telecom-trailer-thumbnail.jpg',
  trailer:'https://www.youtube.com/watch?v=eDon6CQezQY',
  socials:{youtube:'https://www.youtube.com/@skagogames',x:'https://x.com/Skago_CyberApex',instagram:null,discord:'https://discord.gg/j23bms7V73',reddit:'https://www.reddit.com/user/CyberApex_6344/',tiktok:null},
  links:[
    {label:'Steam에서 찜하기',url:'https://store.steampowered.com/app/4599560/Torizon_Telecom/?l=koreana'},
    {label:'무료 데모 보기',url:'https://store.steampowered.com/app/4599570/Torizon_Telecom_Demo/?l=koreana'},
    {label:'공식 웹사이트',url:'https://madeinskago.com/TorizonTelecom/'},
    {label:'Threads',url:'https://www.threads.com/@cyberapex6344'},
    {label:'Bluesky',url:'https://bsky.app/profile/cyberapex6344.bsky.social'},
  ],
  source:'https://madeinskago.com/TorizonTelecom/',checkedAt:'2026-11-05',
})];
export const gameById = id => EXHIBITED_GAMES.find(g=>g.id===id)||null;
