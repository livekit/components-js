# Minimal LiveKit Components app

This is a quick guide to show how you can integrate LiveKit components with your React app. We assume you have a react project ready to follow along.

## Your first LiveKit Room

With the setup out of our way, let's get started. In your React app create a new component that will holds your LiveKit app.

<EmbedSourceFile code={setupExample} language="tsx" />

Let's start by importing the `LiveKitRoom` component. `LiveKitRoom` is the root for almost all other components that we provide. This means that all other components are going to be nested inside this component. Under the hood it will provide the Room context that all the child components will use. This means that you don't have to pass props down the component tree.

<EmbedSourceFile code={firstLkRoomExample} language="tsx" />

Running the app will fail because we still need to provide our LiveKit server URL and the access token. If you already know your URL and have created a access token feel free to use them. If you have no idea what we're talking about, check out the simple tutorial ([Cloud Project Setup](/js-components/cloud-project-setup)) and come back with your shiny new `serverUrl` and `accessToken`.

Welcome back 👋. Go ahead and copy them into the constants `serverUrl` and ​`accessToken`​ and run the app again. Congratulations you successfully created your first video app with LiveKit components! 🎉

This is just the beginning. We try to provide reasonable default for all LiveKit components but the real fun starts when you mix and match the components yourself and create something new.
