export function parseYouTubeUrl(value) {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    let id;
    if (host === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:shorts|embed)\/([^/]+)$/.exec(url.pathname)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
export function emptyMusic() { return { revision: 0, transport: 0, current: null, queue: [], playing: false, position: 0, anchor: 0 }; }
export function musicPosition(music, now) {
  return Math.max(0, music.position + (music.playing ? Math.max(0, now - music.anchor) / 1000 : 0));
}
export function applyMusicAction(music, action, member, isHost, now) {
  if (action.kind === 'music-add') {
    const videoId = parseYouTubeUrl(action.url);
    if (!videoId) return 'YouTube 영상 링크를 확인해 주세요.';
    if (music.queue.length >= 30) return '신청곡은 최대 30곡까지 기다릴 수 있어요.';
    if (music.queue.filter(t => t.by === member.id).length >= 3) return '내 대기곡이 3곡이에요. 재생된 뒤 신청해 주세요.';
    if ([music.current, ...music.queue].some(t => t?.videoId === videoId)) return '이미 신청된 영상이에요.';
    music.queue.push({ id: action.id, videoId, by: member.id, name: member.name });
  } else {
    if (!isHost) return '전체 재생은 방장만 조작할 수 있어요.';
    if (action.op === 'remove') {
      music.queue = music.queue.filter(t => t.id !== action.track);
    } else if (action.op === 'skip') {
      if (action.currentId !== (music.current?.id || null)) return '이미 다음 곡으로 넘어갔어요.';
      music.current = music.queue.shift() || null; music.position = 0; music.anchor = now;
      music.playing = !!music.current; music.transport++;
    } else if (action.op === 'play') {
      if (!music.current) music.current = music.queue.shift() || null;
      if (!music.current) return '먼저 영상을 신청해 주세요.';
      music.position = musicPosition(music, now); music.anchor = now; music.playing = true; music.transport++;
    } else if (action.op === 'pause') {
      music.position = musicPosition(music, now); music.anchor = now; music.playing = false; music.transport++;
    } else if (action.op === 'sync') {
      if (!music.current || action.currentId !== music.current.id) return '재생 중인 곡이 바뀌었어요.';
      if (!Number.isFinite(action.position) || action.position < 0 || action.position > 86400) return '재생 위치가 올바르지 않아요.';
      music.position = action.position; music.anchor = now;
    }
  }
  music.revision++;
  return null;
}
