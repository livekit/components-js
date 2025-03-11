'use client';
import * as React from 'react';
import { useConversation } from '@lib/hooks/useConversation';

export default function ConversationPage(props: { params: { conversationId: string } }) {
  const conversation = useConversation(props.params.conversationId);
  React.useEffect(() => {
    if (!conversation) return;
    console.log('conversation', conversation);
  }, [conversation]);
  return <div>Conversation {props.params.conversationId}</div>;
}
