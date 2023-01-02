# Getting Started with LiveKit Components

> **Info** LiveKit Components is currently React only.

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

## First LiveKit Components app

https://github.com/livekit/components/blob/9715093e61b2607cd840185ea2bf06f1e0e98a19/examples/nextjs/pages/minimal.tsx#L18-L22
