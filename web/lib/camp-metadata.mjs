const titles = new Map();
export async function lookupYouTubeTitle(videoId, fetcher = fetch, now = Date.now()) {
  if (typeof videoId !== 'string' || !/^[\w-]{11}$/.test(videoId)) throw Object.assign(new Error('영상 주소를 확인해 주세요.'), { status: 400 });
  const cached = titles.get(videoId);
  if (cached?.expires > now) return cached.title;
  const endpoint = new URL('https://www.youtube.com/oembed');
  endpoint.search = new URLSearchParams({ url: 'https://www.youtube.com/watch?v=' + videoId, format: 'json' }).toString();
  const response = await fetcher(endpoint.href, { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!response.ok) throw Object.assign(new Error('곡 제목을 불러오지 못했어요.'), { status: 502 });
  const text = await response.text();
  if (text.length > 32_000) throw new Error('Unexpected metadata size');
  const value = JSON.parse(text);
  const title = typeof value.title === 'string' ? value.title.replace(/[\p{C}]/gu, '').trim().slice(0, 160) : '';
  if (!title) throw Object.assign(new Error('곡 제목을 불러오지 못했어요.'), { status: 502 });
  if (titles.size >= 256) titles.delete(titles.keys().next().value);
  titles.set(videoId, { title, expires: now + 60 * 60_000 });
  return title;
}
