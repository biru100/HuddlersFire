'use client';
import { Dialog } from '@astryxdesign/core/Dialog';
import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef, type ReactNode, type Ref } from 'react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseFocus?: () => void;
  label: string;
  width?: number;
  className: string;
  children: ReactNode;
  contentRef?: Ref<HTMLDivElement>;
  container?: HTMLElement;
};

export function CampDialog({open, onOpenChange, onCloseFocus, label, width = 480, className, children, contentRef, container}: Props) {
  const previouslyOpen = useRef(false);
  useLayoutEffect(() => {
    const closed = previouslyOpen.current && !open;
    previouslyOpen.current = open;
    if (closed) onCloseFocus?.();
  }, [open, onCloseFocus]);
  if (!open) return null;
  const dialog = <Dialog isOpen onOpenChange={onOpenChange} aria-label={label} padding={0}
    width={width}
    maxHeight="calc(100dvh - 32px)" className="camp-dialog">
    <div ref={contentRef} className={'camp-dialog-content ' + className}>{children}</div>
  </Dialog>;
  return container ? createPortal(dialog, container) : dialog;
}
