import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyTheme, themeBootstrap } from '../lib/camp-theme.mjs';
import { DEFAULT_SETTINGS, normalizeSettings, readSettings, saveSettings } from '../lib/camp-settings.mjs';

test('new profiles start with quiet effects while existing explicit zero and legacy mute remain silent',()=>{
 assert.equal(normalizeSettings(null).effectsVolume,.25);assert.equal(readSettings({getItem:()=>null}).effectsVolume,.25);
 assert.equal(normalizeSettings({effectsVolume:0}).effectsVolume,0);assert.equal(normalizeSettings({forestVolume:0}).effectsVolume,0);assert.equal(normalizeSettings({effectsVolume:.7,forestVolume:0}).effectsVolume,.7);
});

test('theme migration preserves audio and consent; invalid themes fall back to color', () => {
  const legacy = { effectsVolume:.7, musicVolume:28, musicMuted:true, allowCarry:false };
  assert.deepEqual(normalizeSettings(legacy), {...DEFAULT_SETTINGS, ...legacy, theme:'color'});
  for (const theme of [null, 'system', {}, 12]) assert.equal(normalizeSettings({theme}).theme, 'color');
  let raw = JSON.stringify(legacy);
  const storage = { getItem:()=>raw, setItem:(_,value)=>{raw=value;} };
  saveSettings(storage, {...readSettings(storage),theme:'dark'});
  assert.deepEqual(readSettings(storage), {...DEFAULT_SETTINGS,...legacy,theme:'dark'});
});

test('bootstrap restores saved theme before React, including unavailable or malformed storage', () => {
  for (const [raw,expected] of [[null,'color'],['broken','color'],['{"theme":"dark"}','dark'],['{"theme":"color"}','color'],['{"theme":"unknown"}','color']]) {
    const document={documentElement:{dataset:{}}};
    vm.runInNewContext(themeBootstrap,{document,localStorage:{getItem:()=>raw}});
    assert.equal(document.documentElement.dataset.campTheme,expected);
    assert.equal(document.documentElement.dataset.theme,expected==='dark'?'dark':'light');
    assert.equal(document.documentElement.dataset.astryxTheme,'neutral');
  }
  const document={documentElement:{dataset:{}}};
  vm.runInNewContext(themeBootstrap,{document,localStorage:{getItem:()=>{throw Error('blocked');}}});
  assert.equal(document.documentElement.dataset.campTheme,DEFAULT_SETTINGS.theme);
});

test('separate PIP documents can follow live changes without changing shared state', () => {
  const main={documentElement:{dataset:{}}},pip={documentElement:{dataset:{}}};
  for(const theme of ['color','dark','color']) {
    applyTheme(main,theme);applyTheme(pip,theme);
    assert.deepEqual(pip.documentElement.dataset,main.documentElement.dataset);
  }
});

test('player UI and build inputs use the current design system', () => {
  const web = fileURLToPath(new URL('../', import.meta.url));
  const files = ['package.json', 'package-lock.json', 'vite.config.ts', 'eslint.config.mjs'];
  for (const dir of ['app', 'components', 'lib']) {
    const paths = readdirSync(join(web, dir), {recursive: true});
    files.push(...paths.filter(name => /\.(tsx?|mjs|css)$/.test(name)).map(name => join(dir, name)));
  }
  for (const file of files) {
    const source = readFileSync(join(web, file), 'utf8');
    assert.doesNotMatch(source, /@seed-design\/|@\/seed-design\/|data-seed-|--seed-|shadcn-tailwind-/, file);
  }
  const dependencies = JSON.parse(readFileSync(join(web, 'package.json'), 'utf8')).dependencies;
  assert.ok(dependencies['@astryxdesign/core'] && dependencies['@astryxdesign/theme-neutral']);
});
