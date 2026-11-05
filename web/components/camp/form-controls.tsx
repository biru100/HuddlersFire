'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { TextField, Slider, Switch } from '@seed-design/react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({className='', disabled, required, readOnly, value, defaultValue, ...props}, ref) {
  return <TextField.Root className="camp-input" disabled={disabled} required={required} readOnly={readOnly} value={typeof value==='string'?value:undefined} defaultValue={typeof defaultValue==='string'?defaultValue:undefined}>
    <TextField.Input ref={ref} className={className} disabled={disabled} required={required} readOnly={readOnly} {...props}/>
  </TextField.Root>;
});

export function VolumeSlider({label,value,onChange}: {label:string;value:number;onChange:(value:number)=>void}) {
  const id=useId();
  return <div className="camp-volume">
    <div className="camp-volume-label"><span id={id}>{label}</span><output>{value}%</output></div>
    <Slider.Root min={0} max={100} step={1} values={[value]} onValuesChange={values=>onChange(values[0])} getAriaLabel={()=>label} getAriaLabelledby={()=>id} getAriaValuetext={v=>`${v}%`} className="camp-slider">
      <Slider.Control><Slider.Track><Slider.Range/></Slider.Track><Slider.Thumb thumbIndex={0}><Slider.HiddenInput thumbIndex={0}/></Slider.Thumb></Slider.Control>
    </Slider.Root>
  </div>;
}

export function Toggle({children,checked,onChange,disabled}: {children:ReactNode;checked:boolean;onChange:(checked:boolean)=>void;disabled?:boolean}) {
  return <Switch.Root className="camp-toggle" tone="neutral" checked={checked} onCheckedChange={onChange} disabled={disabled}>
    <Switch.HiddenInput/><Switch.Control><Switch.Thumb/></Switch.Control><Switch.Label>{children}</Switch.Label>
  </Switch.Root>;
}
