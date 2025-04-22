'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useChat, type ReceivedChatMessage } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { ChatEntry } from './chat-entry';
import { useChatMessageList } from './hooks/useChatMessageList';

export type ChatProps = React.HTMLAttributes<HTMLDivElement> & {
  channelTopic?: string;
};

export const Chat = React.forwardRef<HTMLDivElement, ChatProps>((props, ref) => {
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const { onSend, onKeyDown, chatMessages } = useChatMessageList({
    channelTopic: props.channelTopic,
    scrollContent: props.children,
    textAreaRef,
  });

  return (
    <div ref={ref} className={cn('flex flex-col gap-2', props.className)}>
      <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
        {chatMessages.map((message: ReceivedChatMessage) => (
          <ChatEntry key={message.id} entry={message} />
        ))}
      </ScrollArea>
      <div className="flex gap-2">
        <Textarea
          ref={textAreaRef}
          placeholder="Type your message here."
          onKeyDown={onKeyDown}
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
        <Button onClick={onSend}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});
