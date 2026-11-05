'use client';
import { SelectRoot, SelectTrigger, SelectContent, SelectItem } from '@/seed-design/ui/select';

type Props = { label:string; value:string; disabled?:boolean; onChange:(value:string)=>void; options:{value:string;label:string;disabled?:boolean}[] };
export default function ChoiceField({label,value,disabled,onChange,options}:Props) {
  return <SelectRoot label={label} value={[value]} disabled={disabled} onValueChange={values=>{if(values[0])onChange(values[0]);}} hiddenSelectProps={{'aria-label':label}}>
    <SelectTrigger aria-label={label}/>
    <SelectContent>{options.map(option=><SelectItem key={option.value} {...option}/>)}</SelectContent>
  </SelectRoot>;
}
