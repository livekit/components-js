import { addRxPlugin, createRxDatabase, RxCollection } from 'rxdb/plugins/core';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateZSchemaStorage } from 'rxdb/plugins/validate-z-schema';

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBDevModePlugin);

import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { ConversationDocType, conversationSchema } from './schema';

let createDBPromise: Promise<
  ReturnType<
    typeof createRxDatabase<{
      conversations: RxCollection<ConversationDocType>;
    }>
  >
> | null = null;

async function createDatabase() {
  // FIXME: for multiple users, we need to use a different database for each user and limit access to the database to the user
  if (!createDBPromise) {
    createDBPromise = createRxDatabase({
      name: 'openGPT-conversations', // the name of the database
      storage: wrappedValidateZSchemaStorage({ storage: getRxStorageDexie() }),
    });
  }
  const db = await createDBPromise;

  if (!db.conversations) {
    // add collections
    await db.addCollections({
      conversations: {
        schema: conversationSchema,
      },
    });
  }

  return db;
}

export const initializeDB = async () => {
  const db = await createDatabase();
  return db;
};
