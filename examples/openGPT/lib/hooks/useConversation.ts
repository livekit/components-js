import { ConversationDocType } from '@lib/storage/schema';
import * as React from 'react';
import { useRxData } from 'rxdb-hooks';

export function useConversation(id: string) {
  return useRxData<ConversationDocType>('conversations', (collection) => collection.findOne(id));
}

export function useConversationList() {
  return useRxData<ConversationDocType>('conversations', (collection) =>
    collection.find().sort({ timestamp: 'desc' }),
  );
}
