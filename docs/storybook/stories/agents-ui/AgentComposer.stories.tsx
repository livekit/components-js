import React, { useEffect, useRef, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { StoryObj } from '@storybook/react-vite';
import {
  type ReceivedChatMessage,
  useAgent,
  useSessionContext,
  useSessionMessages,
} from '@livekit/components-react';
import { createLocalAudioTrack, type LocalAudioTrack, Participant, Room } from 'livekit-client';
import { AgentSessionProvider } from '../../.storybook/lk-decorators/AgentSessionProvider';
import {
  AgentChatTranscript,
  AgentComposer,
  AgentComposerActions,
  AgentComposerCharacterCount,
  AgentComposerField,
  AgentComposerInput,
  AgentComposerMicrophone,
  AgentComposerSubmit,
  AgentComposerProps,
} from '@livekit/agents-ui';

interface Args extends AgentComposerProps {
  placeholder: string;
  sendDelay: number;
  failSend: boolean;
  /** How long the mock agent takes to reply, in milliseconds. 0 means it doesn't reply. */
  replyDelay: number;
}

const LOCAL_PARTICIPANT = new Room().localParticipant;
const AGENT_PARTICIPANT = new Participant('mock-agent-sid', 'agent', 'Agent');

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mirrors what `useChat` does with a real session: a message shows up once it's sent, and a send
 * that fails rejects.
 */
function useMockChat({
  sendDelay,
  failSend,
  replyDelay,
}: Pick<Args, 'sendDelay' | 'failSend' | 'replyDelay'>) {
  const [messages, setMessages] = useState<ReceivedChatMessage[]>([
    {
      id: 'greeting',
      timestamp: Date.now(),
      message: 'Hi! How can I help?',
      from: AGENT_PARTICIPANT,
    },
  ]);

  const [responding, setResponding] = useState(false);
  const replyTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const reply = () => {
    if (!replyDelay) return;
    clearTimeout(replyTimeout.current);
    setResponding(true);
    replyTimeout.current = setTimeout(() => {
      setResponding(false);
      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          message: 'Here’s my answer.',
          from: AGENT_PARTICIPANT,
        },
      ]);
    }, replyDelay);
  };

  const stop = () => {
    clearTimeout(replyTimeout.current);
    setResponding(false);
  };

  const send = async (message: string) => {
    await wait(sendDelay);
    if (failSend) throw new Error("Couldn't send");
    setMessages((previous) => [
      ...previous,
      { id: crypto.randomUUID(), timestamp: Date.now(), message, from: LOCAL_PARTICIPANT },
    ]);
    reply();
  };

  return { messages, send, responding, stop };
}

/**
 * Opens your real microphone while listening, so the button shows its level, a spinner while it
 * starts, and an error if you block access.
 */
function useMockMicrophone(initialError?: unknown) {
  const [listening, setListening] = useState(false);
  const [track, setTrack] = useState<LocalAudioTrack>();
  const [error, setError] = useState<unknown>(initialError);
  const pending = listening && !track && error === undefined;

  useEffect(() => {
    if (!listening) return;
    let cancelled = false;
    let opened: LocalAudioTrack | undefined;
    createLocalAudioTrack()
      .then((created) => {
        opened = created;
        if (cancelled) created.stop();
        else setTrack(created);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason);
        setListening(false);
      });
    return () => {
      cancelled = true;
      opened?.stop();
      setTrack(undefined);
    };
  }, [listening]);

  const handleListeningChange = (next: boolean) => {
    setError(undefined);
    setListening(next);
  };

  return { listening, onListeningChange: handleListeningChange, track, pending, error };
}

// Styles the default layout's field from outside, since the stories don't pass their own parts
const COMPOSER_CLASS_NAME =
  '*:data-[slot=agent-composer-field]:rounded-lg *:data-[slot=agent-composer-field]:border *:data-[slot=agent-composer-field]:border-input *:data-[slot=agent-composer-field]:p-2 *:data-[slot=agent-composer-field]:pl-3';

function MockChat({ sendDelay, failSend, replyDelay, microphoneError, children, ...props }: Args) {
  const { messages, send, responding, stop } = useMockChat({
    sendDelay,
    failSend,
    replyDelay,
  });
  const microphone = useMockMicrophone(microphoneError);

  return (
    <div className="flex h-[480px] w-96 flex-col gap-2">
      <AgentChatTranscript
        messages={messages}
        agentState={responding ? 'thinking' : 'listening'}
        className="flex-1"
      />
      <AgentComposer
        listening={microphone.listening}
        onListeningChange={microphone.onListeningChange}
        microphoneTrack={microphone.track}
        microphonePending={microphone.pending}
        microphoneError={microphone.error}
        responding={responding}
        onStop={stop}
        {...props}
        onSend={send}
        className={COMPOSER_CLASS_NAME}
      >
        {children}
      </AgentComposer>
    </div>
  );
}

export default {
  component: AgentComposer,
  subcomponents: {
    AgentComposerField,
    AgentComposerInput,
    AgentComposerActions,
    AgentComposerMicrophone,
    AgentComposerSubmit,
    AgentComposerCharacterCount,
  },
  render: (args: Args) => <MockChat {...args} />,
  args: {
    placeholder: 'Type something...',
    sendDelay: 800,
    failSend: false,
    replyDelay: 0,
    disabled: false,
  },
  argTypes: {
    placeholder: { control: 'text' },
    sendDelay: { control: { type: 'number', min: 0, step: 200 } },
    failSend: { control: 'boolean' },
    replyDelay: { control: { type: 'number', min: 0, step: 500 } },
    disabled: { control: 'boolean' },
    maxLength: { control: 'number' },
    onError: { action: 'onError' },
  },
  parameters: {
    layout: 'centered',
    actions: {
      handles: [],
    },
  },
};

export const Default: StoryObj<Args> = {};

/**
 * Every send fails. The message goes back in the composer, and `onError` logs to the Actions panel,
 * where an app would show a toast.
 */
export const SendFails: StoryObj<Args> = {
  args: {
    failSend: true,
  },
};

/** Typing past the limit is allowed. The count turns red and sending is off until you trim it. */
export const MaxLength: StoryObj<Args> = {
  args: {
    maxLength: 20,
  },
};

export const Disabled: StoryObj<Args> = {
  args: {
    disabled: true,
  },
};

/**
 * The agent takes a few seconds to reply. While it does, the send button becomes a stop button
 * until you start typing.
 */
export const StopReply: StoryObj<Args> = {
  args: {
    replyDelay: 4000,
  },
};

/**
 * The microphone couldn't start because access is blocked. Clicking it asks for your microphone
 * again.
 */
export const MicrophoneBlocked: StoryObj<Args> = {
  args: {
    microphoneError: Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' }),
  },
};

/** Unsent text is kept per `draftKey`, so it survives a reload. Type something, then reload. */
export const Draft: StoryObj<Args> = {
  args: {
    draftKey: 'storybook-agent-composer-draft',
  },
};

/** Custom parts: an attach button on the left of the lower row, with the count, microphone, and send on the right. */
export const WithActions: StoryObj<Args> = {
  args: {
    maxLength: 200,
  },
  render: (args: Args) => (
    <MockChat {...args}>
      <AgentComposerField className="flex-col items-stretch gap-1 !pl-2">
        <AgentComposerInput placeholder={args.placeholder} className="px-1" />
        <div className="flex items-center justify-between gap-2">
          <AgentComposerActions>
            <button
              type="button"
              aria-label="Attach file"
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-9 cursor-pointer items-center justify-center rounded-md"
            >
              <PlusIcon className="size-4" />
            </button>
          </AgentComposerActions>
          <AgentComposerActions className="gap-2">
            <AgentComposerCharacterCount />
            <AgentComposerMicrophone />
            <AgentComposerSubmit />
          </AgentComposerActions>
        </div>
      </AgentComposerField>
    </MockChat>
  ),
};

function LiveAgentChat() {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { state: agentState } = useAgent();

  return (
    <div className="flex h-[480px] w-96 flex-col gap-2">
      <AgentChatTranscript messages={messages} agentState={agentState} className="flex-1" />
      <AgentComposer
        placeholder="Type something..."
        className={`data-[disabled]:opacity-60 ${COMPOSER_CLASS_NAME}`}
      />
    </div>
  );
}

/**
 * The composer with no props, talking to an agent in the shared LiveKit sandbox: typed messages go
 * to the session's chat and the microphone turns on the session's microphone. It stays disabled
 * until the session connects, which needs `VITE_PUBLIC_LK_SANDBOX_TOKEN_SERVER_ID` in `.env`.
 */
export const LiveAgent: StoryObj<AgentComposerProps> = {
  decorators: [AgentSessionProvider],
  render: () => <LiveAgentChat />,
};
