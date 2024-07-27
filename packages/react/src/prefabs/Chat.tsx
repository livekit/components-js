import type { ChatMessage, ChatOptions } from '@livekit/components-core';
import * as React from 'react';
import { useMaybeLayoutContext } from '../context';
import { cloneSingleChild } from '../utils';
import type { MessageFormatter } from '../components/ChatEntry';
import { ChatEntry } from '../components/ChatEntry';
import { useChat } from '../hooks/useChat';
import { ChatToggle } from '../components';
import { FileAttachIcon, ChatCloseIcon } from '../assets/icons';

/** @public */
export interface ChatProps extends React.HTMLAttributes<HTMLDivElement>, ChatOptions {
  messageFormatter?: MessageFormatter;
}

/**
 * The Chat component adds a basis chat functionality to the LiveKit room. The messages are distributed to all participants
 * in the room. Only users who are in the room at the time of dispatch will receive the message.
 *
 * @example
 * ```tsx
 * <LiveKitRoom>
 *   <Chat />
 * </LiveKitRoom>
 * ```
 * @public
 */
export function Chat({
  messageFormatter,
  messageDecoder,
  messageEncoder,
  channelTopic,
  ...props
}: ChatProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailRef = React.useRef<HTMLInputElement>(null);
  const ulRef = React.useRef<HTMLUListElement>(null);
  const [imagePackets, setImagePackets] = React.useState<string[]>([]);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const chatOptions: ChatOptions = React.useMemo(() => {
    return { messageDecoder, messageEncoder, channelTopic };
  }, [messageDecoder, messageEncoder, channelTopic]);

  const { send, chatMessages, isSending, sendImagePacket } = useChat(chatOptions);

  const layoutContext = useMaybeLayoutContext();
  const lastReadMsgAt = React.useRef<ChatMessage['timestamp']>(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (thumbnailRef.current && imagePackets.length > 0) {
      if (sendImagePacket) {
        const message = inputRef.current ? inputRef.current.value : '';
        const id = crypto.randomUUID();
        for (let i = 0; i < imagePackets.length; i++) {
          await sendImagePacket(message, id, i, imagePackets.length, imagePackets[i]);
        }
        if (inputRef.current) {
          inputRef.current.value = '';
          inputRef.current.focus();
        }
        thumbnailRef.current.value = '';
        setImagePackets([]);
        setSelectedImage(null);
      }
    } else if (inputRef.current && inputRef.current.value.trim() !== '') {
      if (send) {
        await send(inputRef.current.value);
        inputRef.current.value = '';
        inputRef.current.focus();
      }
    }
  }

  function handleImageUploadClicked(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    if (!thumbnailRef || !thumbnailRef.current) return;

    thumbnailRef.current.click();
  }

  const handleFileRead = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (event.target.files != null) {
      const file = event.target.files[0];
      if (file.size > 3000000) {
        throw Error('Image file is larger than 3 MB, please select a different image');
      } else {
        const fileData = await getFileData(file);
        packetizeFileData(String(fileData));
      }
    }
  };

  const packetizeFileData = (fileData: string) => {
    const maxPacketSize = 50000; // LiveKit doesn't support message length higher than ~6.5 kb
    const packets = [];
    for (let i = 0; i < fileData.length; i += maxPacketSize) {
      packets.push(fileData.slice(i, i + maxPacketSize));
    }
    setImagePackets(packets);
    inputRef.current?.focus();
  };

  const getFileData = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        setSelectedImage(fileReader.result as string);
        resolve(String(fileReader.result).split(',')[1]);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  React.useEffect(() => {
    if (ulRef) {
      ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
    }
  }, [ulRef, chatMessages]);

  React.useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) {
      return;
    }

    if (
      layoutContext.widget.state?.showChat &&
      chatMessages.length > 0 &&
      lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
    ) {
      lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp;
      return;
    }

    const unreadMessageCount = chatMessages.filter(
      (msg) => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current,
    ).length;

    const { widget } = layoutContext;
    if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
      widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount });
    }
  }, [chatMessages, layoutContext?.widget]);

  return (
    <div {...props} className="lk-chat">
      <div className="lk-chat-header">
        Messages
        <ChatToggle className="lk-close-button">
          <ChatCloseIcon />
        </ChatToggle>
      </div>

      <ul className="lk-list lk-chat-messages" ref={ulRef}>
        {props.children
          ? chatMessages.map((msg, idx) =>
              cloneSingleChild(props.children, {
                entry: msg,
                key: msg.id ?? idx,
                messageFormatter,
              }),
            )
          : chatMessages.map((msg, idx, allMsg) => {
              const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
              // If the time delta between two messages is bigger than 60s show timestamp.
              const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;

              return (
                <ChatEntry
                  key={msg.id ?? idx}
                  hideName={hideName}
                  hideTimestamp={hideName === false ? false : hideTimestamp} // If we show the name always show the timestamp as well.
                  entry={msg}
                  messageFormatter={messageFormatter}
                />
              );
            })}
      </ul>
      {selectedImage && (
        <div className="lk-thumbnail">
          <img src={selectedImage} alt="Selected image" />
          <button
            className="lk-delete-button"
            onClick={() => {
              if (thumbnailRef.current) thumbnailRef.current.value = '';
              setImagePackets([]);
              setSelectedImage(null);
            }}
          >
            <ChatCloseIcon />
          </button>
        </div>
      )}
      <form className="lk-chat-form" onSubmit={handleSubmit}>
        <button type="button" onClick={handleImageUploadClicked} className="lk-file-attach-button">
          <FileAttachIcon />
        </button>
        <input
          className="lk-form-control lk-chat-form-input"
          disabled={isSending}
          ref={inputRef}
          type="text"
          placeholder="Enter a message..."
          onInput={(ev) => ev.stopPropagation()}
          onKeyDown={(ev) => ev.stopPropagation()}
          onKeyUp={(ev) => ev.stopPropagation()}
        />
        <button type="submit" className="lk-button lk-chat-form-button" disabled={isSending}>
          Send
        </button>
      </form>
      <input
        disabled={isSending}
        hidden
        ref={thumbnailRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileRead(e)}
        placeholder="upload image..."
      />
    </div>
  );
}
