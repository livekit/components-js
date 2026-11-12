import * as React from 'react';
import { useRoomContext } from '../../context';
import { setupDataMessageHandler } from '@livekit/components-core';
import { DataTopic } from '@livekit/components-core';
import { mergeProps } from '../../utils';
import { useEmojiReactionContext } from '../../context/EmojiReactionContext';

const EMOJI_OPTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢', '👏', '🎉'];

export interface EmojiReactionButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
    showIcon?: boolean;
    showText?: boolean;
}

export function EmojiReactionButton({
    showIcon = true,
    showText = false,
    ...props
}: EmojiReactionButtonProps) {
    const room = useRoomContext();
    const { addReaction } = useEmojiReactionContext();
    const [isOpen, setIsOpen] = React.useState(false);
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const popupRef = React.useRef<HTMLDivElement>(null);

    const { send, isSendingObservable } = React.useMemo(
        () => setupDataMessageHandler(room, DataTopic.REACTIONS),
        [room],
    );

    const [isSending, setIsSending] = React.useState(false);

    React.useEffect(() => {
        const subscription = isSendingObservable.subscribe(setIsSending);
        return () => subscription.unsubscribe();
    }, [isSendingObservable]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                buttonRef.current &&
                popupRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                !popupRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmojiClick = React.useCallback(
        async (emoji: string) => {
            if (isSending) return;

            try {
                const payload = new TextEncoder().encode(JSON.stringify({ emoji }));
                await send(payload);

                // Add local reaction immediately
                addReaction({
                    emoji,
                    from: room.localParticipant,
                });

                // Don't close the popup - let user send multiple reactions
            } catch (error) {
                console.error('Failed to send emoji reaction:', error);
            }
        },
        [send, isSending, room.localParticipant, addReaction],
    );

    const htmlProps = mergeProps(
        {
            className: 'lk-button lk-emoji-reaction-button',
            onClick: () => setIsOpen(!isOpen),
            disabled: isSending,
        },
        props,
    );

    return (
        <div className="lk-button-group">
            <button ref={buttonRef} {...htmlProps}>
                {showIcon && <span>😊</span>}
                {showText && 'Reactions'}
            </button>
            {isOpen && (
                <div ref={popupRef} className="lk-emoji-popup">
                    {EMOJI_OPTIONS.map((emoji) => (
                        <button
                            key={emoji}
                            className="lk-emoji-option"
                            onClick={() => handleEmojiClick(emoji)}
                            disabled={isSending}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 