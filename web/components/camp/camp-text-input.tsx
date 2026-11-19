'use client';

import { TextInput, type TextInputProps } from '@astryxdesign/core/TextInput';
import type { InputHTMLAttributes } from 'react';

// Astryx forwards native field attributes and composition events to its input.
type CampTextInputProps = TextInputProps & Pick<InputHTMLAttributes<HTMLInputElement>,
  'maxLength' | 'pattern' | 'onCompositionStart' | 'onCompositionEnd'>;

export function CampTextInput(props: CampTextInputProps) {
  return <TextInput aria-label={props.label} {...props}/>;
}
