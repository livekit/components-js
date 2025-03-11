'use client';

import { useRxCollection } from 'rxdb-hooks';
import { useConversationList } from './hooks/useConversation';
import { useRouter } from 'next/navigation';
import { ConversationDocType } from './storage/schema';
export function ConversationList() {
  const conversations = useConversationList();
  const router = useRouter();
  const collection = useRxCollection<ConversationDocType>('conversations');

  if (conversations.isFetching) {
    return <div>Loading...</div>;
  }

  const handleNewConversation = async () => {
    if (!collection) return;
    const conversation = await collection.upsert({
      id: crypto.randomUUID(),
      name: 'New Convo',
      timestamp: Date.now(),
      messages: [],
    });
    router.push(`/conversations/${conversation.id}`);
  };

  return (
    <div>
      <h1>Conversations</h1>
      <button onClick={handleNewConversation}>New Conversation</button>
      <ul>
        {conversations.result.map((conversation) => (
          <li key={conversation.id}>
            <a href={`/conversations/${conversation.id}`}>{conversation.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
