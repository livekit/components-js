# LiveKit Components

Create your [LiveKit](https://livekit.io) WebRTC experience without worrying about state.

> **Disclaimer** This is project is in active development and open sourced as a developer preview. While APIs are unlikely to drastically change from here onwards, there's still the chance that some things might need tweaking after an update. We appreciate feedback from the community and are planning to incorporate your feedback to get to a stable version as soon as possible!

## About LiveKit Components

LiveKit Components give you a declarative way to build your real-time LiveKit audio/video frontend with React.

Every use case is different and apps in the real world are individual and unique. We don't pretend to have the perfect solution that fits all use cases. Instead, we've taken an approach where we give you reasonable defaults, without taking away full control over each component if you want it.

### 🤩 LiveKit Components handle all state for you

You don't have to worry about participant or room events to update the state of your application. All components handle state management for you, and by using React contexts, you don't have to route properties through your component tree.

### 🛠️ Carefully crafted set of components

We offer all the necessary building blocks to build a live video or audio app in no time.

### 🚀 Beautiful and sane defaults

We put a lot of effort into creating components that work and look great right out of the gate. Get started quickly by using the defaults of your components or overwrite them by simply adding children.

```tsx
//1️⃣ Use the components defaults to render a video conference app
<LiveKitRoom token="my-token" serverUrl="wss://my-livekit-server" connect={true} >
  <VideoConference />
</LiveKitRoom>

// 2️⃣ or overwrite the defaults with your custom component tree.
<LiveKitRoom >
  <ParticipantLoop>
    {/*  */}
  </ParticipantLoop>
</LiveKitRoom>

```

### 🎨 Style them the way you want

Because most of the components are merely wrappers around standard HTML-Elements you can overwrite the basic component style how ever you want.

On top of that we provide a handful of pre-defined css variables to easily theme LiveKit Components to your needs.

### 📈 Room to grow: create your own components

The component we offer does not fit your requirements? We have the solution for you! Each component comes with its own React hook that allows you to create your own component with minimal boilerplate. Of course, you can also combine your own component with our pre-built components. It's common to start with our components to quickly sketch out a concept, and then replace some of them with your own components to build something we could never have imagined.

### Get started

The best way to get started is to use the [`@livekit/components-react`](/packages/react/) package and install it.

```bash
yarn install @livekit/components-react
```

Creating a full fledged video conference is as easy as

```tsx
import { LiveKitRoom, VideoConference } from '@livekit/components-react';

export function App() {
  return (
    <LiveKitRoom token="<livekit-token>" serverUrl="<url-to-livekit-server>" connect={true}>
      <VideoConference />
    </LiveKitRoom>
  );
}
```

### Examples

We have a fully featured video conferencing application in our [examples](/examples/meet/) that powers https://meet.livekit.io.

Additionally there are some basic example on how to use and customize LiveKit Components in the [nextjs example folder](/examples/next/)

## Development Setup

### Setup Monorepo

This repo consists of multiple packages that partly build on top of each other.
It relies on yarn workspaces and [Turborepo](https://turbo.build/repo/docs) (which gets installed automatically).

On the root level:

```bash
yarn install
```

In order to link up initial dependencies and check whether everything has installed correctly run

```bash
yarn build
```

This will build all the packages in `/packages` and the examples in `/examples` once.

After that you can use a more granular command to only rebuild the packages you are working on.
E.g. to test and automatically rebuild package dependencies for the nextjs example, run:

```bash
yarn dev:next
```

> **Note** for the examples to work you'll need to make sure to copy the the contents of .env.example in the specific example folder to a newly created .env.local file and adjust the values accordingly to your livekit server setup.

## Architecture Overview

![](./.github/assets/components-architecture.png)

<!--NAV_START-->

## Monorepo Navigation

- [Home 👈](/README.md)
- **Docs**
  - [Docs](/docs/alpha-docs/README.md)
  - [Storybook](/docs/storybook/README.md)
- **Framework Implementations**:
  - [React](/packages/react/README.md)
- **Examples**
  - [Next.js](/examples/nextjs/README.md)
- **Internal Packages**
  - [Core](/packages/core/README.md)
  - [Styles](/packages/styles/README.md)

<!--NAV_END-->
