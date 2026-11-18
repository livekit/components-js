import type { Participant, ChatMessage } from 'livekit-client';

/** @public */
export type { ChatMessage };

export type SentMessage = ChatMessage;

type ReceivedMessageWithType<Type extends string, Metadata extends object = object> = {
  id: string;
  timestamp: number;

  type: Type;

  from?: Participant;
  attributes?: Record<string, string>;
} & Metadata;

/**
 * The sender of a message, as a first-class discriminated field rather than a stringly-typed attribute.
 * `origin` is the discriminator (`user` / `agent` / `system`) and `role` is the matching chat role,
 * locked to it. `system` covers the system and developer instructions in an agent's chat context; filter
 * on `origin` to hide them. The last branch (`origin?: never`) keeps messages that predate this field
 * assignable, so adding it is backwards compatible.
 * @public
 */
export type MessageSender =
  | { origin: 'user'; role: 'user' }
  | { origin: 'agent'; role: 'assistant' }
  | { origin: 'system'; role: 'system' | 'developer' }
  | { origin?: never; role?: never };

/** @private */
type ReceivedChatMessageWithRequiredType = ReceivedMessageWithType<
  'chatMessage',
  ChatMessage & {
    from?: Participant;
    attributes?: Record<string, string>;
  }
>;

/** @public */
export type ReceivedChatMessage = Omit<ReceivedChatMessageWithRequiredType, 'type'> & {
  type?: 'chatMessage';
} & MessageSender;

export type ReceivedUserTranscriptionMessage = ReceivedMessageWithType<
  'userTranscript',
  {
    message: string;
  }
> &
  MessageSender;

export type ReceivedAgentTranscriptionMessage = ReceivedMessageWithType<
  'agentTranscript',
  {
    message: string;
  }
> &
  MessageSender;

/**
 * A tool call the agent made. `arguments` is the raw (JSON) argument string, as the model produced it.
 * @beta
 */
export type ReceivedFunctionCallMessage = ReceivedMessageWithType<
  'functionCall',
  {
    /** Pairs the call with its {@link ReceivedFunctionCallOutputMessage}. */
    callId: string;
    name: string;
    arguments: string;
  }
> &
  MessageSender;

/** The result of a tool call, paired to its {@link ReceivedFunctionCallMessage} by `callId`. @beta */
export type ReceivedFunctionCallOutputMessage = ReceivedMessageWithType<
  'functionCallOutput',
  {
    callId: string;
    name: string;
    output: string;
    isError: boolean;
  }
> &
  MessageSender;

/** The conversation was handed from one agent to another. @beta */
export type ReceivedAgentHandoffMessage = ReceivedMessageWithType<
  'agentHandoff',
  {
    /** The agent handing off, or null when the conversation starts with this handoff. */
    oldAgentId: string | null;
    newAgentId: string;
  }
> &
  MessageSender;

/** The agent's configuration changed mid-conversation (its instructions and/or tools). @beta */
export type ReceivedAgentConfigUpdateMessage = ReceivedMessageWithType<
  'agentConfigUpdate',
  {
    /** The new instructions, or null when they didn't change. */
    instructions: string | null;
    toolsAdded: Array<string>;
    toolsRemoved: Array<string>;
  }
> &
  MessageSender;

/**
 * Any message in a conversation, discriminated on `type`. Text (`chatMessage`, the default when `type`
 * is absent) and transcripts carry a `message` string; the other kinds are the rest of an agent's chat
 * context (tool calls and their output, handoffs, config updates).
 * @beta
 */
export type ReceivedMessage =
  | ReceivedUserTranscriptionMessage
  | ReceivedAgentTranscriptionMessage
  | ReceivedChatMessage
  | ReceivedFunctionCallMessage
  | ReceivedFunctionCallOutputMessage
  | ReceivedAgentHandoffMessage
  | ReceivedAgentConfigUpdateMessage;
// TODO: images? attachments? rpc?
