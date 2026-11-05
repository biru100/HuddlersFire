'use client';
import { useEffect, useRef } from 'react';
import { SnackbarProvider, Snackbar, useSnackbarAdapter } from '@/seed-design/ui/snackbar';

function Message({message}:{message:string}) {
  const adapter=useSnackbarAdapter();
  const latest=useRef(adapter);
  useEffect(()=>{latest.current=adapter;},[adapter]);
  useEffect(()=>{if(message)latest.current.create({render:()=> <Snackbar message={message}/>,timeout:4500});else latest.current.dismiss();},[message]);
  return null;
}
export default function CampNotice({message}:{message:string}) {
  return <SnackbarProvider><Message message={message}/></SnackbarProvider>;
}
