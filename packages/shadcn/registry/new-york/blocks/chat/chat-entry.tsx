import { cn } from '@/lib/utils';
import type { MessageFormatter, ReceivedChatMessage } from '@livekit/components-react';
import * as React from 'react';
import { useChatMessage } from './hooks/utils';
export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The chat massage object to display. */
  entry: ReceivedChatMessage;
  /** Hide sender name. Useful when displaying multiple consecutive chat messages from the same person. */
  hideName?: boolean;
  /** Hide message timestamp. */
  hideTimestamp?: boolean;
  /** An optional formatter for the message body. */
  messageFormatter?: MessageFormatter;
}

export const ChatEntry = React.forwardRef<HTMLLIElement, ChatEntryProps>(
  ({ entry, messageFormatter, hideName, hideTimestamp, ...props }, ref) => {
    const { message, hasBeenEdited, time, locale, name } = useChatMessage(entry, messageFormatter);

    return (
      <li
        ref={ref}
        className={cn('flex flex-col gap-0.5', props.className)}
        title={time.toLocaleTimeString(locale, { timeStyle: 'full' })}
        data-lk-message-origin={entry.from?.isLocal ? 'local' : 'remote'}
        {...props}
      >
        {(!hideTimestamp || !hideName || hasBeenEdited) && (
          <span className="flex text-sm text-muted-foreground">
            {!hideName && <strong className="mt-2">{name}</strong>}

            {!hideTimestamp && (
              <span className="ml-auto align-self-end">
                {hasBeenEdited && '*'}
                {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
              </span>
            )}
          </span>
        )}

        <span
          className={cn('rounded-lg bg-muted p-2', {
            'bg-primary': entry.from?.isLocal,
            'text-primary-foreground': entry.from?.isLocal,
          })}
        >
          {message}
        </span>
        <span className="">
          {entry.attachedFiles?.map(
            (file) =>
              file.type.startsWith('image/') && (
                <img
                  style={{ maxWidth: '300px', maxHeight: '300px' }}
                  key={file.name}
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                />
              ),
          )}
        </span>
      </li>
    );
  },
);
