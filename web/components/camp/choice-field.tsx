'use client';
import { Selector } from '@astryxdesign/core/Selector';

type Props = {label: string; value: string; disabled?: boolean; onChange: (value: string) => void; options: {value: string; label: string; disabled?: boolean}[]};
export default function ChoiceField({label, value, disabled, onChange, options}: Props) {
  return <Selector label={label} value={value} isDisabled={disabled} options={options} onChange={onChange}/>;
}
