import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChat, type ReceivedChatMessage } from '@livekit/components-react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';
export type ChatProps = {
  className?: string;
  channelTopic?: string;
};

export const Chat = (props: ChatProps) => {
  const chatOptions = React.useMemo(
    () => ({ channelTopic: props.channelTopic ?? 'lk.chat' }),
    [props.channelTopic],
  );
  const { chatMessages, send } = useChat(chatOptions);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const handleSend = () => {
    if (messageRef.current) {
      send(messageRef.current.value);
      messageRef.current.value = '';
    }
  };
  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
        {chatMessages.map((message: ReceivedChatMessage) => (
          <div key={message.id}>{message.message}</div>
        ))}
      </ScrollArea>
      <div className="flex gap-2">
        <Textarea ref={messageRef} placeholder="Type your message here." />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};
