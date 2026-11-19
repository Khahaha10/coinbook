'use client';

import { Check, CircleAlert } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

const TOAST_MS = 2400;

export type ToastTone = 'success' | 'error';

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((message: string, tone: ToastTone = 'success') => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div role="status" aria-live="polite" className="sr">
        {toast?.message}
      </div>
      {toast ? (
        <div
          key={toast.id}
          aria-hidden="true"
          className={cn(
            'fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 animate-fade items-center gap-2 rounded-control bg-ink-900 px-4 py-3 text-sm font-medium text-white @min-[768px]/cb:bottom-8',
            toast.tone === 'error' ? 'w-max max-w-[calc(100vw-32px)]' : 'whitespace-nowrap',
          )}
        >
          {toast.tone === 'error' ? (
            <CircleAlert size={20} className="flex-none text-ink-100" />
          ) : (
            <Check size={20} className="text-ink-100" />
          )}
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}
