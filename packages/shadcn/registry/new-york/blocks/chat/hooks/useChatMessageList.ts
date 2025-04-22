import * as React from 'react';
import { useAutoScroll } from './useAutoScroll';
import { useChat } from '@livekit/components-react';

export function useChatMessageList({
  channelTopic,
  scrollContent,
  textAreaRef,
}: {
  channelTopic?: string;
  scrollContent?: React.ReactNode;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const chatOptions = React.useMemo(() => ({ channelTopic }), [channelTopic]);

  const { scrollRef, isAtBottom, autoScrollEnabled, scrollToBottom, disableAutoScroll } =
    useAutoScroll({
      content: scrollContent,
    });

  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const { chatMessages, send } = useChat(chatOptions);
  const handleSend = () => {
    if (textAreaRef.current) {
      send(textAreaRef.current.value);
      textAreaRef.current.value = '';
    }
  };

  const onHitEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [scrollAreaRef, chatMessages]);

  return {
    onSend: handleSend,
    onKeyDown: onHitEnter,
    chatMessages,
  };
}
