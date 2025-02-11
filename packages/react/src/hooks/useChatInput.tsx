import * as React from 'react';
import { useRoomContext } from '../context';
import { ChatMessage, SendTextOptions } from 'livekit-client';

interface ChatInputProps {
  onSend: (text: string, options: SendTextOptions) => Promise<ChatMessage>;
}

export function useChatInput({ onSend }: ChatInputProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textRef = React.useRef<HTMLInputElement>(null);
  const room = useRoomContext();

  const [isSending, setIsSending] = React.useState(false);
  const [filesToSend, setFilesToSend] = React.useState<Map<string, File>>(new Map());

  const onInput = () => {
    if (fileRef.current === null) {
      return;
    }
    const files = fileRef.current.files;
    if (files) {
      for (let i = 0; i < files?.length; i++) {
        const item = files.item(i);
        if (item) {
          filesToSend.set(item.name, item);
        }
      }
    }
    setFilesToSend(new Map(filesToSend));
  };

  const handleFileDelete = (file: File) => {
    filesToSend.delete(file.name);
    setFilesToSend(new Map(filesToSend));
  };

  const handleSubmit = React.useCallback(
    async (ev: React.FormEvent) => {
      ev.preventDefault();
      if (!textRef.current || !fileRef.current) {
        return;
      }
      setIsSending(true);
      try {
        console.log('sending message');
        await onSend(textRef.current.value, {
          topic: 'user-message',
          attachedFiles: Array.from(filesToSend.values()),
        });
      } finally {
        fileRef.current.files = null;
        textRef.current.value = '';
        setIsSending(false);
        filesToSend.clear();
        setFilesToSend(filesToSend);
        textRef.current.focus();
      }
    },
    [room],
  );
}
