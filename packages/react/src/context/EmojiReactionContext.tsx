import * as React from 'react';
import type { Participant } from 'livekit-client';

export interface EmojiReaction {
    emoji: string;
    id: string;
    timestamp: number;
    from: Participant;
}

interface EmojiReactionContextValue {
    addReaction: (reaction: Omit<EmojiReaction, 'id' | 'timestamp'>) => void;
    reactions: EmojiReaction[];
}

const EmojiReactionContext = React.createContext<EmojiReactionContextValue | null>(null);

export function EmojiReactionProvider({ children }: React.PropsWithChildren) {
    const [reactions, setReactions] = React.useState<EmojiReaction[]>([]);

    const addReaction = React.useCallback((reaction: Omit<EmojiReaction, 'id' | 'timestamp'>) => {
        const newReaction: EmojiReaction = {
            ...reaction,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };

        setReactions(prev => [...prev, newReaction]);

        // Remove reaction after 3 seconds
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
        }, 3000);
    }, []);

    const value = React.useMemo(() => ({
        addReaction,
        reactions,
    }), [addReaction, reactions]);

    return (
        <EmojiReactionContext.Provider value={value}>
            {children}
        </EmojiReactionContext.Provider>
    );
}

export function useEmojiReactionContext() {
    const context = React.useContext(EmojiReactionContext);
    if (!context) {
        throw new Error('useEmojiReactionContext must be used within EmojiReactionProvider');
    }
    return context;
} 