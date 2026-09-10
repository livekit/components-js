import * as React from 'react';
import { useRoomContext } from '../../context';
import { setupDataMessageHandler } from '@livekit/components-core';
import { DataTopic } from '@livekit/components-core';
import { useMaybeParticipantContext } from '../../context';
import { useEmojiReactionContext } from '../../context/EmojiReactionContext';

export interface EmojiReactionProps {
    className?: string;
}

export function EmojiReaction({ className }: EmojiReactionProps) {
    const room = useRoomContext();
    const participant = useMaybeParticipantContext();
    const { reactions: globalReactions } = useEmojiReactionContext();
    const [localReactions, setLocalReactions] = React.useState<Array<{ emoji: string; id: string; timestamp: number }>>([]);

    // Filter reactions for this specific participant
    const participantReactions = React.useMemo(() => {
        const fromContext = globalReactions
            .filter(reaction => reaction.from.identity === participant?.identity)
            .map(reaction => ({
                emoji: reaction.emoji,
                id: reaction.id,
                timestamp: reaction.timestamp,
            }));

        return [...fromContext, ...localReactions];
    }, [globalReactions, localReactions, participant?.identity]);

    React.useEffect(() => {
        if (!room || !participant) return;

        const { messageObservable } = setupDataMessageHandler(room, DataTopic.REACTIONS);

        const subscription = messageObservable.subscribe((message) => {
            // Listen for messages from this participant (excluding local participant since they're handled by context)
            if (message.from?.identity === participant.identity && !message.from?.isLocal) {
                try {
                    const data = JSON.parse(new TextDecoder().decode(message.payload));
                    if (data.emoji) {
                        const reactionId = `${Date.now()}-${Math.random()}`;
                        setLocalReactions(prev => [...prev, {
                            emoji: data.emoji,
                            id: reactionId,
                            timestamp: Date.now()
                        }]);

                        // Remove reaction after 3 seconds
                        setTimeout(() => {
                            setLocalReactions(prev => prev.filter(r => r.id !== reactionId));
                        }, 3000);
                    }
                } catch (error) {
                    console.error('Failed to parse emoji reaction:', error);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [room, participant]);

    if (participantReactions.length === 0) return null;

    return (
        <div className={`lk-emoji-reactions ${className || ''}`}>
            {participantReactions.map((reaction) => (
                <div key={reaction.id} className="lk-emoji-reaction">
                    {reaction.emoji}
                </div>
            ))}
        </div>
    );
} 