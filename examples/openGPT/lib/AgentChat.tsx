import * as React from 'react';
import { ChatEntry, ChatProps, useChat } from '@livekit/components-react';

export function AgentChat({ messageFormatter, ...props }: ChatProps) {
  const ulRef = React.useRef<HTMLUListElement>(null);
  const textRef = React.useRef<HTMLTextAreaElement>(null);

  const { chatMessages, send, isSending } = useChat();

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (textRef.current && textRef.current.value.trim() !== '') {
      await send(textRef.current.value);
      textRef.current.value = '';
      textRef.current.focus();
      handleInput();
    }
  }

  React.useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [ulRef, chatMessages]);

  const handleInput = () => {
    if (!textRef.current) {
      return;
    }
    textRef.current.style.height = 'auto'; // Reset height
    textRef.current.style.height = textRef.current.scrollHeight + 'px'; // Set new height
  };

  const handleKeyUp: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    event.stopPropagation();
    if (event.shiftKey) {
      return;
    }
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div {...props} className="lk-chat">
      <ul className="lk-list lk-chat-messages" ref={ulRef}>
        {chatMessages.map((msg, idx, allMsg) => {
          return (
            <ChatEntry
              key={msg.id ?? idx}
              hideName={true}
              hideTimestamp={true}
              entry={msg}
              messageFormatter={messageFormatter}
            />
          );
        })}
      </ul>
      <form className="lk-chat-form" onSubmit={handleSubmit}>
        <textarea
          className="lk-form-control lk-chat-form-input"
          disabled={isSending}
          ref={textRef}
          placeholder="Enter a message..."
          onInput={handleInput}
          onKeyDown={(ev) => ev.stopPropagation()}
          onKeyUp={handleKeyUp}
          style={{
            minHeight: '40px', // Set minimum height
            maxHeight: '200px', // Set maximum height before scrolling
            overflowY: 'auto', // Allow scrolling if maxHeight is reached
            resize: 'none', // Prevent manual resizing
          }}
        />
        <button type="submit" className="lk-button lk-chat-form-button" disabled={isSending}>
          Send
        </button>
      </form>
    </div>
  );
}
