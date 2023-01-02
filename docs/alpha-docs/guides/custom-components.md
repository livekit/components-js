# Custom Components

## Building your own video chat

In this guide we are going to build up a Video conferencing app from the previous getting starte example. But instead of using the LiveKitRoom component alone we are going to use more LiveKit components to build it ourselves. What's the point of building the same app again you may ask? By building the up the Component tree ourself we gain full flexibility about how parts of the app will look like. Using the default LiveKitRoom works but we guess it will often only be the starting point on your way to build your custom app.

### Setup

Let's start with the basis setup from the last getting starte guide.

<EmbedSourceFile code={setupExample} language="tsx" />

If we now add a child element to `LiveKitRoom`, let's start with a good old `<div>Hello World</div>`, the default LiveKit app should now be gone and instead we see "Hello World".

<EmbedSourceFile code={overwriteDefaultsExample} language="tsx" range={{ start: 6, end: -2 }} />

We see that in the moment where we add children to components with defaults we overwrite those default. Lets now recreate the default LiveKit video app with other existing LiveKit components. You will see, its as simple as plug and play.

### Add Participants

The central part of every video conferencing app are the participants. Lets start by adding some components to display their video streams.

<EmbedSourceFile code={addParticipantsExample} language="tsx" range={{ start: 11, end: -2 }} />

What is happening here? Lets go through it component by component starting from the most outer component. As we already know the `LiveKitRoom` component is always the root for all the other components. As a child of `LiveKitRoom` we added the `Participants` component. The `Participants` component accepts zero or one child components. The child component is used as a template to render all participants of the room. If no template component is provided it falls back to a default participant view. Try commenting out everting inside of `Participants` to see the defaults.

We don't want to use the defaults, therefore we provided our own `ParticipantView` with a `ParticipantName` as a child. The `ParticipantView` is responsible to render the participants video and the `ParticipantName` simply displays the name of the participant on top of the video.
