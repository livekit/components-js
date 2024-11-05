import * as React from 'react';
import { useRoomContext } from '../../context';
import { ChatMessage, SendTextOptions } from 'livekit-client/dist/src/room/types';

export interface RichUserInputProps {
  send: (text: string, options: SendTextOptions) => Promise<ChatMessage>;
}

export function RichUserInput(props: RichUserInputProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textRef = React.useRef<HTMLInputElement>(null);
  const room = useRoomContext();

  const [isSending, setIsSending] = React.useState(false);
  const [filesToSend, setFilesToSend] = React.useState<Set<File>>(new Set());

  const handleFileInput = () => {
    if (fileRef.current === null) {
      return;
    }
    const files = fileRef.current.files;
    if (files) {
      for (let i = 0; i < files?.length; i++) {
        const item = files.item(i);
        if (item) {
          filesToSend.add(item);
        }
      }
    }
    setFilesToSend(new Set(filesToSend));
  };

  const handleFileDelete = (file: File) => {
    filesToSend.delete(file);
    setFilesToSend(new Set(filesToSend));
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
        await props.send(textRef.current.value, {
          topic: 'user-message',
          attachedFiles: Array.from(filesToSend),
        });
      } finally {
        fileRef.current.files = null;
        textRef.current.value = '';
        textRef.current.focus();
        setIsSending(false);
        setFilesToSend(new Set());
      }
    },
    [room],
  );
  return (
    <>
      <div
        style={{
          bottom: 0,
          position: 'absolute',
          width: '99.9%',
        }}
      >
        <div className="lk-file-list">
          {Array.from(filesToSend).map((file) => (
            <div key={file.name}>
              <span>{file.name}</span>
              <button className="lk-button" onClick={() => handleFileDelete(file)}>
                ⨯
              </button>
            </div>
          ))}
        </div>
        <form className="lk-chat-form" onSubmit={handleSubmit}>
          <label className="lk-button" htmlFor="file-upload">
            📎
          </label>
          <input
            style={{ display: 'none' }}
            ref={fileRef}
            onInput={handleFileInput}
            id="file-upload"
            type="file"
          />
          <input
            className="lk-form-control lk-chat-form-input"
            disabled={isSending}
            ref={textRef}
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
      </div>
    </>
  );
}
