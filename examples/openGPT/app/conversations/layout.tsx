'use client';
import * as React from 'react';
import { Provider } from 'rxdb-hooks';
import { initializeDB } from '@lib/storage/initializeDB';
import { ConversationList } from '@lib/ConversationList';
import { RxCollection, RxDatabase } from 'rxdb';
import { ConversationDocType } from '@lib/storage/schema';

export default function ConversationLayout({ children }: { children: React.ReactNode }) {
  const [db, setDb] =
    React.useState<RxDatabase<{ conversations: RxCollection<ConversationDocType> }>>();

  React.useEffect(() => {
    // RxDB instantiation can be asynchronous
    initializeDB().then(setDb);
  }, []);
  return (
    <div>
      <Provider db={db}>
        <aside>
          <ConversationList />
        </aside>
        <main>{children}</main>
      </Provider>
    </div>
  );
}
