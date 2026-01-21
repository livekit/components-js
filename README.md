<!--BEGIN_BANNER_IMAGE-->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/.github/banner_dark.png">
  <source media="(prefers-color-scheme: light)" srcset="/.github/banner_light.png">
  <img style="width:100%;" alt="The LiveKit icon, the name of the repository and some sample code in the background." src="https://raw.githubusercontent.com/livekit/components-js/main/.github/banner_light.png">
</picture>
<!--END_BANNER_IMAGE-->

<h1>
  LiveKit Components
</h1>

<!--BEGIN_DESCRIPTION-->
Use this SDK to add realtime, multi-modal, agentic experiences to your React app. By connecting to <a href="https://livekit.io/">LiveKit</a> Cloud or a self-hosted server, you can quickly build agentic experiences with just a few lines of code.
<!--END_DESCRIPTION-->

<br/>
<br/>

<picture>
  <source srcset="./.github/assets/readme-hero-dark.webp" media="(prefers-color-scheme: dark)">
  <source srcset="./.github/assets/readme-hero-light.webp" media="(prefers-color-scheme: light)">
  <img src="./.github/assets/readme-hero-light.webp" alt="App screenshot">
</picture>

## Agents UI Quick Start

Agents UI is a set of open source [Shadcn](https://ui.shadcn.com/) components for building voice-first agents using LiveKit.

You can find more information in the [Agents UI API references](https://docs.livekit.io/reference/components/shadcn/) and in the [Agents UI README](packages/shadcn/README.md).

## Prerequisites

Before installing Agents UI, make sure your environment meets the following requirements:

- [Node.js](https://nodejs.org/), version 18 or later
- [shadcn/ui](https://ui.shadcn.com/docs/installation/next) is installed in your project.

> [!NOTE]
> Running any install command will automatically install shadcn/ui for you.
> Agents UI is built targeting React 19 (no forwardRef usage) and Tailwind CSS 4.

### Installation

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
pnpm dlx shadcn@latest add @agents-ui/agent-session-provider @agents-ui/agent-control-bar @agents-ui/agent-chat-transcript @agents-ui/agent-audio-visualizer-bar
```

Next, you need a running agent. If you don't already have one, [it only takes a few minutes to set one up](https://docs.livekit.io/agents/start/voice-ai).

The rest of this guide assumes your agent is configured for [explicit dispatch](https://docs.livekit.io/agents/worker/agent-dispatch/#explicit) with `agent_name="example-agent"`.

Then, you can use the agents sdk to connect and interact with your agent:

```tsx
'use client';

import { TokenSource } from 'livekit-client';
import { VideoTrack, useAgent, useSession, useSessionContext } from '@livekit/components-react';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentAudioVisualizerBar } from '@/components/agents-ui/agent-audio-visualizer-bar';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';

// Generated credentials manually and put them here
// Or, generate them another way: https://github.com/livekit/client-sdk-js?tab=readme-ov-file#generating-a-urltoken-with-tokensource
const tokenSource = TokenSource.literal({
  serverUrl: 'wss://my-livekit-server',
  participantToken: 'generated-jwt',
});

function AgentUI() {
  const session = useSessionContext();
  const agent = useAgent(session);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Chat transcript */}
      <AgentChatTranscript />

      {/* Local camera feed: */}
      {session.local.cameraTrack ? <VideoTrack trackRef={session.local.cameraTrack} /> : null}

      {/* Agent camera feed */}
      {agent.cameraTrack ? (
        <VideoTrack trackRef={agent.cameraTrack} />
      ) : (
        <AgentAudioVisualizerBar />
      )}

      {/* Agent control bar for local audio */}
      <AgentControlBar variant="livekit" isConnected={session.isConnected} />

      {/* Renders a start audio button if the browser blocks autoplay of audio */}
      <StartAudioButton label="Start audio" />
    </div>
  );
}

export default function Example() {
  const session = useSession(tokenSource, {
    agentName: 'example-agent' /* <== Put your agent name here! */,
  });

  const toggleStarted = () => {
    if (session.connectionState === 'disconnected') {
      session.start();
    } else {
      session.end();
    }
  };

  return (
    <AgentSessionProvider session={session}>
      {session.isConnected ? (
        <AgentUI />
      ) : (
        <button onClick={toggleStarted} disabled={session.connectionState === 'connecting'}>
          Connect
        </button>
      )}
    </AgentSessionProvider>
  );
}
```

## Docs

For more information checkout the

- [Agents UI API references](https://docs.livekit.io/reference/components/shadcn/)
- [LiveKit Components Docs](https://docs.livekit.io/reference/components/react/)

## Examples

### Voice Agent Starter Application

Check out our fully featured voice agent, quick start application built with React and LiveKit Components. The full implementation is available in the [livekit-examples/agent-starter-react](https://github.com/livekit-examples/agent-starter-react) repo. Give it a test drive by creating a sandbox voice agent in [LiveKit Cloud](https://cloud.livekit.io/projects/p_/sandbox/templates/agent-starter-react).

### Video Conference Starter Application

We also have a fully featured video conferencing application built on top of LiveKit Components. Start a video conference at [meet.livekit.io](https://meet.livekit.io) and take a look at the implementation in the [livekit-examples/meet](https://github.com/livekit-examples/meet) repo.

## Development Setup

If you are interested in contributing to the project or running the examples that are part of this mono-repository, then you must first set up your development environment.

### Setup Monorepo

This repo consists of multiple packages that partly build on top of each other.
It relies on pnpm workspaces and [Turborepo](https://turbo.build/repo/docs) (which gets installed automatically).

Clone the repo and run `pnpm install` the root level:

```shell
pnpm install
```

In order to link up initial dependencies and check whether everything has installed correctly run

```shell
pnpm build
```

This will build all the packages in `/packages` and the examples in `/examples` once.

After that you can use a more granular command to only rebuild the packages you are working on.
E.g. to test and automatically rebuild package dependencies for the nextjs example, run:

```shell
pnpm dev:next
```

> **Note**
> For the examples to work you'll need to make sure to copy the the contents of .env.example in the specific example folder to a newly created .env.local file and adjust the values accordingly to your livekit server setup.

## FAQ

<details>
<summary>
Why is there a `@livekit/components-core` package?
</summary>
By abstracting most of the state handling logic into a common core we wanted to make sure that other framework implementations can be created with minimal code duplication. We chose observables as the main data structure for this core as its concepts translate really well to for example React's hooks, solid's signals, Svelte's stores, Vue's composables, and angular loves observables out of the box.
</details>

<details>
<summary>
Did you consider using Custom Elements?
</summary>
Yes, we did consider building LK Components with custom elements (web components). We ultimately decided against it in order to give users the option to develop within the constraints of their chosen framework with all its specific concepts (e.g. in the case of react hooks, context etc.). That said the road towards supporting custom elements isn't entirely closed off. If the adoption of custom elements gains traction we can imagine providing a framework implementation that additionally compiles to custom elements (e.g. solid or svelte).
</details>

<details>
<summary>
Will there be an implementation for my favorite framework?
</summary>
The highest priority is currently to get the core and react packages to a stable version that people love to work with. Once this is done we will decide on what other frameworks we might to support officially. If you want to develop an implementation for your favorite framework based on the core package we'd love to talk to you about it!
</details>

<!--NAV_START-->

## Monorepo Navigation

- [Home 👈](/README.md)
- **Framework Implementations**:
  - [React](/packages/react/README.md)
- **Examples**
  - [Next.js](/examples/nextjs/README.md)
- **Internal Packages**
  - [Core](/packages/core/README.md)
  - [Styles](/packages/styles/README.md)
  - [Shadcn](/packages/shadcn/README.md)

<!--NAV_END-->
<!--BEGIN_REPO_NAV-->
<br/><table>
<thead><tr><th colspan="2">LiveKit Ecosystem</th></tr></thead>
<tbody>
<tr><td>LiveKit SDKs</td><td><a href="https://github.com/livekit/client-sdk-js">Browser</a> · <a href="https://github.com/livekit/client-sdk-swift">iOS/macOS/visionOS</a> · <a href="https://github.com/livekit/client-sdk-android">Android</a> · <a href="https://github.com/livekit/client-sdk-flutter">Flutter</a> · <a href="https://github.com/livekit/client-sdk-react-native">React Native</a> · <a href="https://github.com/livekit/rust-sdks">Rust</a> · <a href="https://github.com/livekit/node-sdks">Node.js</a> · <a href="https://github.com/livekit/python-sdks">Python</a> · <a href="https://github.com/livekit/client-sdk-unity">Unity</a> · <a href="https://github.com/livekit/client-sdk-unity-web">Unity (WebGL)</a> · <a href="https://github.com/livekit/client-sdk-esp32">ESP32</a></td></tr><tr></tr>
<tr><td>Server APIs</td><td><a href="https://github.com/livekit/node-sdks">Node.js</a> · <a href="https://github.com/livekit/server-sdk-go">Golang</a> · <a href="https://github.com/livekit/server-sdk-ruby">Ruby</a> · <a href="https://github.com/livekit/server-sdk-kotlin">Java/Kotlin</a> · <a href="https://github.com/livekit/python-sdks">Python</a> · <a href="https://github.com/livekit/rust-sdks">Rust</a> · <a href="https://github.com/agence104/livekit-server-sdk-php">PHP (community)</a> · <a href="https://github.com/pabloFuente/livekit-server-sdk-dotnet">.NET (community)</a></td></tr><tr></tr>
<tr><td>UI Components</td><td><b>React</b> · <a href="https://github.com/livekit/components-android">Android Compose</a> · <a href="https://github.com/livekit/components-swift">SwiftUI</a> · <a href="https://github.com/livekit/components-flutter">Flutter</a></td></tr><tr></tr>
<tr><td>Agents Frameworks</td><td><a href="https://github.com/livekit/agents">Python</a> · <a href="https://github.com/livekit/agents-js">Node.js</a> · <a href="https://github.com/livekit/agent-playground">Playground</a></td></tr><tr></tr>
<tr><td>Services</td><td><a href="https://github.com/livekit/livekit">LiveKit server</a> · <a href="https://github.com/livekit/egress">Egress</a> · <a href="https://github.com/livekit/ingress">Ingress</a> · <a href="https://github.com/livekit/sip">SIP</a></td></tr><tr></tr>
<tr><td>Resources</td><td><a href="https://docs.livekit.io">Docs</a> · <a href="https://github.com/livekit-examples">Example apps</a> · <a href="https://livekit.io/cloud">Cloud</a> · <a href="https://docs.livekit.io/home/self-hosting/deployment">Self-hosting</a> · <a href="https://github.com/livekit/livekit-cli">CLI</a></td></tr>
</tbody>
</table>
<!--END_REPO_NAV-->

