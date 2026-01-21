# @agents-ui

Agents UI is the easiest way to build agentic voice applications faster on top of LiveKit primitives.

Agents UI is a component library built on top of [shadcn/ui](https://ui.shadcn.com/) and [AI Elements](https://ai-sdk.dev/elements) to accelerate building agentic applications on top of LiveKit's real-time platform. It provides pre-built components like controling IO, managing sessions, rendering transcripts, visualing audio streams, and more.

## Components

### Agent UI Components

Located in `components/agents-ui/`, these are the primary components for building agent interfaces:

| Component                    | Description                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `AgentSessionProvider`       | Wraps your agent UI, providing session context and audio rendering                      |
| `AgentControlBar`            | Full-featured control bar with mic, camera, screen share, chat, and disconnect controls |
| `AgentTrackToggle`           | Toggle button for media tracks (microphone, camera, screen share)                       |
| `AgentTrackControl`          | Media control with device selector dropdown                                             |
| `AgentDisconnectButton`      | Button to end the agent session                                                         |
| `AgentChatTranscript`        | Displays the conversation transcript including voice transcriptions                     |
| `AgentChatIndicator`         | Visual indicator for agent thinking/processing state                                    |
| `AgentAudioVisualizerBar`    | Audio visualizer with horizontal set of animated bars                                   |
| `AgentAudioVisualizerRadial` | Audio visualizer with a radial set of animated bars                                     |
| `AgentAudioVisualizerWave`   | Audio visualizer with an animated wave                                                  |
| `AgentAudioVisualizerAura`   | Audio visualizer with an animated aura ring                                             |
| `StartAudioButton`           | Button to start audio when browser blocks autoplay                                      |

## Prerequisites

Before installing AI Elements, make sure your environment meets the following requirements:

- [Node.js](https://nodejs.org/), version 18 or later
- [shadcn/ui](https://ui.shadcn.com/docs/installation/nextjs) is installed in your project.

> [!NOTE]
> Running any install command will automatically install shadcn/ui for you.
> Agents UI is built targeting React 19 (no forwardRef usage) and Tailwind CSS 4.

## Installation

You can install Agents UI components using the shadcn/ui CLI.

First add the Agents UI registry to your components.json file:

```json
{
  ...
  "registries": {
     ...
    "@agents-ui": "https://livekit.io/ui/r/{name}.json"
  }
}
```

Then install the component you want to use from the CLI. Ensure you've navigated to the root of your project.

```bash
npx shadcn@latest add @agents-ui/{component-name}
```

## Usage

Most Agents UI components require access to a LiveKit session object for access to values like agent state or audio tracks. The session object can be created from a [TokenSource](/reference/client-sdk-js/variables/TokenSource.html), and provided by wrapping the component in an [AgentSessionProvider](../component/agent-session-provider/page.mdoc).

```tsx
'use client';

import { useSession } from '@livekit/components-react';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';

const TOKEN_SOURCE = TokenSource.sandboxTokenServer(process.env.MY_LK_SANDBOX_TOKEN_SERVER_ID);

export function Demo() {
  const session = useSession(TOKEN_SOURCE);

  return (
    <AgentSessionProvider session={session}>
      <AgentControlBar
        variant={{ variant }}
        isChatOpen={{ isChatOpen }}
        isConnected={{ isConnected }}
        controls={{ controls }}
      />
    </AgentSessionProvider>
  );
}
```

## Extensibility

Agents UI components take as many primitive attributes as possible. For example, the [AgentControlBar](/reference/components/shadcn/component/agent-control-bar/page.mdoc) component extends `HTMLAttributes<HTMLDivElement>`, so you can pass any props that a div supports. This makes it easy to extend the component with your own styles or functionality.

You can edit any Agents UI component's source code in the `components/agents-ui` directory. For style changes, we recommend passing in tailwind classes to override the default styles. Take a look at the source code to get a sense of how to override component's default styles.

If you re-install any Agents UI component by rerunning `npx shadcn@latest add @agents-ui/{component-name}`, the CLI will ask before overwriting the file so you can save any custom changes you made.

After installation, no additional setup is needed. The component's styles (Tailwind CSS classes) and scripts are already integrated. You can start interacting with the component in your app immediately.

## Architecture

```
packages/shadcn/
├── components/
│   ├── agents-ui/          # LiveKit agent-specific components
│   ├── ai-elements/        # Reusable AI conversation components
│   ├── ui/                 # Base UI primitives (shadcn/ui style)
│   └── session-provider.tsx
├── hooks/
│   └── agents-ui/          # Custom hooks for agent UI logic
├── lib/
│   └── utils.ts            # Utility functions (cn, etc.)
├── scripts/
│   ├── doc-gen.ts          # Generates prop documentation
│   └── update.ts           # Deploys registry to destination
├── registry.json           # shadcn registry configuration
└── index.ts                # Package exports
```

### Key Architectural Decisions

1. **shadcn Registry Distribution**: Components are distributed via shadcn's registry system rather than as a traditional npm package. This allows users to copy components directly into their codebase and customize them freely.

2. **Tailwind CSS Styling**: All components use Tailwind CSS with the `class-variance-authority` (CVA) pattern for variant management, following shadcn/ui conventions.

3. **Radix UI Primitives**: Base UI components are built on [Radix UI](https://www.radix-ui.com/) primitives for accessibility and behavior.

4. **LiveKit Integration**: Agent components integrate with `@livekit/components-react` hooks and context providers for real-time communication features.

5. **Motion Animations**: Animations are powered by [Motion](https://motion.dev/) (formerly Framer Motion) for smooth, performant transitions.

## Development

### Preview

Preview the components in storybook by running from the root of the monorepo:

```bash
pnpm dev:storybook
```

You can find the components in [Storybook](http://localhost:6006) under the `Agents UI` section.

### Scripts

```bash
# Build the shadcn registry
pnpm registry:build

# Serve the registry locally (http://localhost:3210)
pnpm registry:serve

# Generate prop documentation
pnpm registry:doc-gen

# Build and deploy to configured destination paths
pnpm registry:update
```

### Environment Variables

Create a `.env.local` file with:

```env
# Path to deploy built registry files
DEST_REGISTRY_PATH=/path/to/destination/registry

# Path to deploy generated prop types documentation
DEST_PROP_TYPES_PATH=/path/to/destination/prop-types.json
```

## Dependencies

### Peer Dependencies

- `@livekit/components-react` - LiveKit React components
- `livekit-client` - LiveKit client SDK
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `tailwindcss` ^4
- `shadcn` ^3.5.1
- `motion` ^12.16.0
- `ai` ^5.0.105

## Reporting issues

Please file issues in the [GitHub repository](https://github.com/livekit/components-js/issues).
