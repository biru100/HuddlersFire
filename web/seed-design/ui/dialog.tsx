'use client';
import { forwardRef, useCallback, useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from 'react';
import { Dialog as SeedDialog, Portal as SeedPortal } from '@seed-design/react';
function Root(props:ComponentProps<typeof SeedDialog.Root>){return <SeedDialog.Root closeOnEscape closeOnInteractOutside {...props}/>;}
function Portal({children,container}:{children:ReactNode;container?:HTMLElement}){
  const target=useMemo(()=>({current:container||null}),[container]);
  return <SeedPortal container={container?target:undefined}><SeedDialog.Positioner className="camp-dialog-positioner">{children}</SeedDialog.Positioner></SeedPortal>;
}
type ContentProps=ComponentProps<typeof SeedDialog.Content>&{onCloseAutoFocus?:(event:Event)=>void};
const Content=forwardRef<HTMLDivElement,ContentProps>(function Content({onCloseAutoFocus,...props},ref){
  const callback=useRef(onCloseAutoFocus);
  useEffect(()=>{callback.current=onCloseAutoFocus;},[onCloseAutoFocus]);
  const bind=useCallback((node:HTMLDivElement|null)=>{
    if(typeof ref==='function')ref(node);else if(ref)ref.current=node;
    // SEED uses Radix FocusScope. Restore field focus at its actual teardown,
    // after the exit animation, instead of racing it with a timeout.
    if(node)node.addEventListener('focusScope.autoFocusOnUnmount',event=>callback.current?.(event),{once:true});
  },[ref]);
  return <SeedDialog.Content ref={bind} {...props}/>;
});
export const Dialog={Root,Portal,Content,Overlay:SeedDialog.Backdrop,Title:SeedDialog.Title,Description:SeedDialog.Description,Close:SeedDialog.CloseButton};
