import * as React from 'react';
import { ChatMessage, SendTextOptions } from 'livekit-client';
import { DataTopic } from '@livekit/components-core';

export interface RichUserInputProps {
  send: (text: string, options: SendTextOptions) => Promise<ChatMessage>;
}

export function RichUserInput(props: RichUserInputProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const textRef = React.useRef<HTMLInputElement>(null);

  const [isSending, setIsSending] = React.useState(false);
  const [filesToSend, setFilesToSend] = React.useState<Map<string, File>>(new Map());

  const handleFileInput = () => {
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

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!textRef.current || !fileRef.current) {
      return;
    }
    setIsSending(true);
    try {
      await props.send(textRef.current.value, {
        topic: DataTopic.CHAT,
        attachments: Array.from(filesToSend.values()),
      });
    } finally {
      fileRef.current.files = null;
      textRef.current.value = '';
      setIsSending(false);
      filesToSend.clear();
      setFilesToSend(filesToSend);
      textRef.current.focus();
    }
  };
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
          {Array.from(filesToSend.values()).map((file) => (
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
          />
          <button type="submit" className="lk-button lk-chat-form-button" disabled={isSending}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}
