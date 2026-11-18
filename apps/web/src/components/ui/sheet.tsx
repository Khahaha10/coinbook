'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { buttonClasses } from './button';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Sheet({ open, onOpenChange, title, description, children }: SheetProps) {
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      returnFocus.current = document.activeElement;
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 flex animate-fade items-end justify-center bg-[var(--scrim)] @min-[768px]/cb:items-center @min-[768px]/cb:p-6">
          <Dialog.Content
            aria-describedby={description ? 'sheet-description' : undefined}
            onCloseAutoFocus={(e) => {
              if (!returnFocus.current) return;
              e.preventDefault();
              returnFocus.current.focus();
            }}
            className="max-h-[94%] w-full animate-sheet-up overflow-auto rounded-t-paper bg-paper px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))] text-text shadow-paper @min-[768px]/cb:max-w-[480px] @min-[768px]/cb:animate-fade @min-[768px]/cb:rounded-paper @min-[768px]/cb:p-6"
          >
            <div
              aria-hidden="true"
              className="mx-auto mt-1 mb-3 h-1 w-10 rounded-sm bg-rule-strong @min-[768px]/cb:hidden"
            />
            <div className="flex min-h-11 items-center justify-between gap-3">
              <Dialog.Title className="text-h2 leading-[1.2] font-medium">{title}</Dialog.Title>
              <Dialog.Close
                className={buttonClasses({ variant: 'secondary', icon: true })}
                aria-label="Tutup"
              >
                <X size={20} aria-hidden="true" />
              </Dialog.Close>
            </div>
            {description ? (
              <Dialog.Description id="sheet-description" className="sr">
                {description}
              </Dialog.Description>
            ) : null}
            <div className="mt-3">{children}</div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
