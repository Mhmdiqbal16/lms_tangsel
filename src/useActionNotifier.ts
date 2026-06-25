import { useEffect } from 'react';
import { ToastTone, useToast } from '@/ToastContext';

interface ActionMessage {
  tone: ToastTone;
  text: string;
}

export function useActionNotifier(message: ActionMessage | null) {
  const { showToast } = useToast();

  useEffect(() => {
    if (!message) {
      return;
    }

    showToast({
      tone: message.tone,
      message: message.text,
    });
  }, [message, showToast]);
}
