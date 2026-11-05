import { createHash, randomUUID } from 'node:crypto';
import { mkdir, realpath, lstat, writeFile, link, rename, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseYouTubeUrl } from '../../../../web/lib/camp-media.mjs';

const projectRoot = fileURLToPath(new URL('../../../../', import.meta.url));
const requireWeb = createRequire(new URL('../../../../web/package.json', import.meta.url));
const MAX_BYTES = 8 * 1024 * 1024;
const USAGE = 'node .agents/skills/camp-add-game-booth/scripts/prepare-thumbnail.mjs --game-id <lowercase-kebab-id> --trailer-url <https-YouTube-URL> [--dry-run] [--replace]';

export function parseArgs(args) {
  const options = { replace: false, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') return { help: true };
    const key = { '--game-id': 'gameId', '--trailer-url': 'trailerUrl', '--replace': 'replace', '--dry-run': 'dryRun' }[arg];
    if (!key) throw new Error(`Unknown option: ${arg}`);
    if (options[key] && options[key] !== false) throw new Error(`Repeated option: ${arg}`);
    if (key === 'replace' || key === 'dryRun') options[key] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value: ${arg}`);
      options[key] = value;
    }
  }
  return options;
}

export function makePlan({ gameId, trailerUrl }) {
  if (typeof gameId !== 'string' || gameId.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameId)) {
    throw new Error('game-id must be 1-64 lowercase letters/digits with single hyphens between segments.');
  }
  const videoId = parseYouTubeUrl(trailerUrl);
  if (!videoId) throw new Error('A valid HTTPS YouTube video URL is required.');
  const filename = `${gameId}-trailer-thumbnail.jpg`;
  return {
    gameId, videoId, cover: `/games/${filename}`,
    output: join(projectRoot, 'web', 'public', 'games', filename),
    candidates: ['maxresdefault', 'hqdefault'].map(quality => ({ quality, url: `https://i.ytimg.com/vi/${videoId}/${quality}.jpg` })),
  };
}

async function readBounded(response) {
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Image exceeds 8 MiB.');
  if (!response.body) throw new Error('Empty image response.');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) throw new Error('Image exceeds 8 MiB.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}

export async function downloadThumbnail(plan, { fetchImpl = fetch } = {}) {
  const { loadImage } = requireWeb('@napi-rs/canvas');
  const failures = [];
  for (const candidate of plan.candidates) {
    let response;
    try {
      response = await fetchImpl(candidate.url, { redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!/^image\/jpeg(?:;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('Expected image/jpeg.');
      const bytes = await readBounded(response);
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new Error('Invalid JPEG signature.');
      const image = await loadImage(bytes);
      if (image.width < 480 || image.height < 270) throw new Error(`Placeholder or low resolution: ${image.width}x${image.height}`);
      return { bytes, width: image.width, height: image.height, quality: candidate.quality, sourceUrl: candidate.url };
    } catch (error) {
      failures.push(`${candidate.quality}: ${error.message}`);
    } finally {
      if (response?.body && !response.body.locked) await response.body.cancel().catch(() => {});
    }
  }
  throw new Error(`No usable thumbnail; no file written. ${failures.join(' | ')}`);
}

function isInside(root, target) {
  const rel = relative(root, target);
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

export async function assertOutputPath(target, root = projectRoot) {
  const actualRoot = await realpath(root);
  const expectedDir = join(actualRoot, 'web', 'public', 'games');
  const dir = dirname(target);
  if (resolve(dir) !== expectedDir || !isInside(actualRoot, resolve(target))) throw new Error('Output must stay in this project web/public/games directory.');
  // Check each existing parent before creating the next one; refuse linked parents.
  let current = actualRoot;
  for (const segment of ['web', 'public', 'games']) {
    current = join(current, segment);
    try {
      const stat = await lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory() || await realpath(current) !== current) throw new Error('Output parent must be a local directory, not a link.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await mkdir(current);
    }
  }
  try {
    const stat = await lstat(target);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('Output must be a regular file.');
    return true;
  } catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export async function saveThumbnail(target, bytes, { replace = false, root = projectRoot } = {}) {
  const exists = await assertOutputPath(target, root);
  if (exists && !replace) throw new Error('Output already exists; use --replace for an authorized update.');
  const temp = join(dirname(target), `.${randomUUID()}.thumbnail.tmp`);
  try {
    await writeFile(temp, bytes, { flag: 'wx' });
    if (replace) await rename(temp, target);
    else await link(temp, target); // Atomic create without overwriting a racing writer.
  } finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

export async function run(args, { fetchImpl = fetch, outputRoot = projectRoot } = {}) {
  const options = parseArgs(args);
  if (options.help) return { usage: USAGE };
  const plan = makePlan(options);
  // outputRoot is dependency injection for offline tests; the CLI never exposes an output path.
  plan.output = join(outputRoot, 'web', 'public', 'games', `${plan.gameId}-trailer-thumbnail.jpg`);
  if (options.dryRun) return { ...plan, dryRun: true, replace: options.replace };
  const exists = await assertOutputPath(plan.output, outputRoot);
  if (exists && !options.replace) throw new Error('Output already exists; use --replace for an authorized update.');
  const result = await downloadThumbnail(plan, { fetchImpl });
  await saveThumbnail(plan.output, result.bytes, { replace: options.replace, root: outputRoot });
  return {
    ...plan, candidates: undefined, ...result, bytes: result.bytes.length,
    sha256: createHash('sha256').update(result.bytes).digest('hex'),
    creditNote: `YouTube thumbnail for ${plan.videoId}; source: ${result.sourceUrl}. Record the verified rights holder and official trailer source in web/public/games/CREDITS.txt.`,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
