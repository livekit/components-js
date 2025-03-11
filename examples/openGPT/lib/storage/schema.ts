import { toTypedRxJsonSchema, ExtractDocumentTypeFromTypedRxJsonSchema, RxJsonSchema } from 'rxdb';

const conversationSchemaLiteral = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100, // <- the primary key must have maxLength
    },
    name: {
      type: 'string',
    },
    timestamp: {
      type: 'number',
    },
    messages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
          },
          content: {
            type: 'string',
          },
        },
        required: ['role', 'content'],
      },
    },
  },
  required: ['id', 'name', 'timestamp', 'messages'],
} as const;

const schemaTyped = toTypedRxJsonSchema(conversationSchemaLiteral);

// aggregate the document type from the schema
export type ConversationDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

// create the typed RxJsonSchema from the literal typed object.
export const conversationSchema: RxJsonSchema<ConversationDocType> = conversationSchemaLiteral;
