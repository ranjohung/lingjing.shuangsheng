"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef, type ReactNode } from "react";
interface ModalProps { open: boolean; onClose: () => void; title?: string; icon?: string; children: ReactNode }
export function Modal({open,onClose,title,icon,children}:ModalProps) {
 const previousFocus=useRef<HTMLElement|null>(null);
 return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose()}}><Dialog.Portal>
   <Dialog.Overlay className="dialog-overlay" />
   <Dialog.Content className="dialog-content" aria-describedby={undefined}
     onOpenAutoFocus={()=>{previousFocus.current=document.activeElement as HTMLElement}}
     onCloseAutoFocus={event=>{if(previousFocus.current?.isConnected){event.preventDefault();previousFocus.current.focus()}}}>
     <div className="mb-6 flex items-center justify-between gap-4"><Dialog.Title className="text-lg font-semibold">{icon&&<i aria-hidden="true" className={`${icon} mr-2 text-purple-200`} />}{title??"操作面板"}</Dialog.Title><Dialog.Close asChild><button aria-label="关闭对话框" className="flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:bg-white/10"><i aria-hidden="true" className="fa-solid fa-xmark" /></button></Dialog.Close></div>
     {children}
   </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
