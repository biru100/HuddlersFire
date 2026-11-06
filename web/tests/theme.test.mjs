import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { applyTheme, themeBootstrap } from '../lib/camp-theme.mjs';
import { DEFAULT_SETTINGS, normalizeSettings, readSettings, saveSettings } from '../lib/camp-settings.mjs';

test('new profiles start with quiet effects while existing explicit zero and legacy mute remain silent',()=>{
 assert.equal(normalizeSettings(null).effectsVolume,.25);assert.equal(readSettings({getItem:()=>null}).effectsVolume,.25);
 assert.equal(normalizeSettings({effectsVolume:0}).effectsVolume,0);assert.equal(normalizeSettings({forestVolume:0}).effectsVolume,0);assert.equal(normalizeSettings({effectsVolume:.7,forestVolume:0}).effectsVolume,.7);
});

test('theme migration preserves audio and consent; invalid themes fall back to color', () => {
  const legacy = { effectsVolume:.7, musicVolume:28, musicMuted:true, allowCarry:false };
  assert.deepEqual(normalizeSettings(legacy), { ...legacy, theme:'color' });
  for (const theme of [null, 'system', {}, 12]) assert.equal(normalizeSettings({theme}).theme, 'color');
  let raw = JSON.stringify(legacy);
  const storage = { getItem:()=>raw, setItem:(_,value)=>{raw=value;} };
  saveSettings(storage, {...readSettings(storage),theme:'dark'});
  assert.deepEqual(readSettings(storage), {...legacy,theme:'dark'});
});

test('bootstrap restores saved theme before React, including unavailable or malformed storage', () => {
  for (const [raw,expected] of [[null,'color'],['broken','color'],['{"theme":"dark"}','dark'],['{"theme":"color"}','color'],['{"theme":"unknown"}','color']]) {
    const document={documentElement:{dataset:{}}};
    vm.runInNewContext(themeBootstrap,{document,localStorage:{getItem:()=>raw}});
    assert.equal(document.documentElement.dataset.campTheme,expected);
    assert.equal(document.documentElement.dataset.seedColorMode,expected==='dark'?'dark-only':'light-only');
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
