'use client';
import { Slider } from '@astryxdesign/core/Slider';

export function VolumeSlider({label, value, onChange}: {label: string; value: number; onChange: (value: number) => void}) {
  return <div className="camp-volume" data-volume-label={label}><Slider label={label} value={value} onChange={onChange}
    width="100%" min={0} max={100} step={1} valueDisplay="text" formatValue={v => v + '%'} /></div>;
}
