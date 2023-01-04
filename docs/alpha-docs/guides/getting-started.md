# Getting Started with LiveKit Components

> **Info** LiveKit Components is currently React only. We assume you have a react project ready to follow along.

## Install LiveKit Components

Use your favorite package manager to install the React LiveKit Components package.

```bash
npm install @livekit/components-react
# or
yarn add @livekit/components-react
# or
pnpm add @livekit/components-react
```

## Prepare the backend server

A LiveKit app consists of two parts:

- The user-facing frontend, for example the app that we will build after finishing this step.
- The backend server, which is responsible for user authentication and, of course, for managing and distributing all the video and audio data sent and received by your frontend.

For your frontend to work properly, we need a LiveKit Server. There are two equally good options to setup your backend. What every options you choose, after returning you should have the **Server URL** that points to your LiveKit Server and a generated user **Access Token**.

**Option A: [LiveKit Cloud](setup-a-livekit-cloud-project.md)**

**Option B: [Host LiveKit Server your self](https://github.com/livekit/livekit)**

## Build your first LiveKit Components app

With the setup out of our way, let's get started. In your React app create a new component that will hold your LiveKit app.

> **Info** If you don't want to setup your own React app. You can follow along with the examples included in the monorepo. To setup the examples head over to [examples](../../../examples/nextjs/README.md). The example closest to the here show code can be found [here](../../../examples/nextjs/pages/minimal.tsx)

```tsx
export const MyFirstLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return <>{'Your LiveKit Component tree will go here'}</>;
};
```

Let's start by importing the `LiveKitRoom` component. `LiveKitRoom` is the root for almost all other components that we provide. This means that all other components are going to be nested inside this component. Under the hood it will provide the Room context that all the child components will use. This means that you don't have to pass props down the component tree.

```tsx
import { LiveKitRoom } from '@livekit/components-react';

const MyFirstLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return <LiveKitRoom serverUrl={serverUrl} token={accessToken} connect={true}></LiveKitRoom>;
};
```

Running the app will fail because we still need to provide our LiveKit server URL and the access token. If you already know your URL and have created a access token feel free to use them. If you have no idea what we're talking about, check out the simple tutorial ([Setup a LiveKit Cloud project](setup-a-livekit-cloud-project.md)) and come back with your shiny new `serverUrl` and `accessToken`.

Welcome back 👋. Go ahead and copy them into the constants `serverUrl` and ​`accessToken`​ and run the app again. Congratulations you successfully created your first video app with LiveKit Components! 🎉

This is just the beginning. We try to provide reasonable default for all LiveKit components but the real fun starts when you mix and match the components yourself and create something new.
