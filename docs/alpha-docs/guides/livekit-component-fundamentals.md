# LiveKit Components fundamentals

In this guide you will learn:

- what default children are and how to overwrite them
- how state is passed to down the component tree via contexts
- how loops work in LiveKit Components

## LiveKitRoom Component

The `LiveKitRoom` component is the starting point of your LiveKit app and root of the LiveKit component tree. It provides the room context to all its child components. Like almost all other LiveKit Components it accepts regular HTML elements as well as LiveKit Components as its children. If no children are nested inside it, a default component tree is rendered instead. Learn more in the next chapter.

```tsx
import { LiveKitRoom } from '@livekit/components-react';
import * as React from 'react';

const MyLiveKitApp = () => {
  const serverUrl = '';
  const accessToken = '';
  return;
  <LiveKitRoom serverUrl={serverUrl} token={accessToken} connect={true}></LiveKitRoom>;
};
```

## Differences between Components, Prefabs and Layouts

We developed a simple mental model for the LiveKit Components system.

### Component

Components are the basic building blocks and often just a wrapper around a standard HTML element. All standard HTML attributes are passed directly to the underlying component. So you can pass `classNames`, `style` and any other attributes to achieve the look you want.
All Components live [here](../../../packages/react/src/components/)

### Prefab (Prefabricated-Components)

Prefabs use components under the hood and add additional features, styles, but also reasonable defaults. Some Prefabs come with variations that you can choose. They are designed opinionated and are not meant to be extended. You can do it, we just don't build them with that intention in mind.
All Prefabs live [here](../../../packages/react/src/prefabs/)

### Layout

Layouts are wrappers that provide a certain layout for its children. At the moment it is mainly focused around participant layouts like grid or focus layout.
All Layouts live [here](../../../packages/react/src/layout/)

## Component default children

When ever sensible LiveKit Components render a default child component or a tree of components. This allows you to quickly sketch or test some ideas with sensible and good looking defaults. If you have your own ideas you can simply overwrite the defaults by nesting other LiveKit Components or a regular HTML element inside it.

```tsx
// This renders the default ParticipantView.
<ParticipantView></ParticipantView>

// This overwrites the default ParticipantView and renders a p tag instead.
<ParticipantView>
    <p>Hello World</p>
</ParticipantView>
```

## Contexts

Contexts are used allow child components to access parent state without the need to pass it via props down the component tree. In return this means that if a component depends on some context you have to make sure that this context is provided some where up the component tree.

```tsx

// ✅ This works!
// ConnectionState depends on the RoomContext which is provided by LiveKitRoom.
<LiveKitRoom>
  <ConnectionState />
</LiveKitRoom>

// ✅ This works!
// The context provider (LiveKitRoom) does not have to be a immediate parent of the component (ConnectionState) needing the context.
<LiveKitRoom>
    <div>
        <ConnectionState />
    </div>
</LiveKitRoom>

// ❌ This will cause an error!
// ConnectionState depends on a parent component to provide the RoomContext.
<LiveKitRoom></LiveKitRoom>
<ConnectionState />
```

If you only use LiveKit Components without creating custom components yourself, you don't need to interact with the contexts. Just make sure that the component tree meets the context requirements of all components. If it doesn't, you'll get an error message telling you which context is missing.

The two most important contexts are:

### RoomContext

The RoomContext provides the [Room](https://docs.livekit.io/client-sdk-js/classes/Room.html) object as a context.

```tsx
/* 1️⃣ LiveKitRoom provides the RoomContext. */
<LiveKitRoom serverUrl="server-url" token="user-access-token" connect={true}>
  {/* 2️⃣ ConnectionState uses the RoomContext to retrieve information about the connection state of the room. */}
  <ConnectionState />
</LiveKitRoom>
```

### ParticipantContext

The ParticipantContext provides a [Participant](https://docs.livekit.io/client-sdk-js/classes/Room.html) object to all child components.

```tsx
/* 1️⃣ ParticipantView provides the ParticipantContext. */
<ParticipantView>
  {/* 2️⃣ ParticipantName uses the ParticipantContext to get the participant name. */}
  <ParticipantName />
</ParticipantView>
```

## Loops

In LiveKit Components loops are used for two things:

1. Loop over all or a filtered subset of participants
2. Loop over all or a filtered subset of tracks

Both loops have in common that they only accept one or no child. If no child is provided the default component is used. If a child is provided, it is used as a template for every item in the loop.

### Participant Loop

The Participant Loop allows you to loop over all or a subset of participants.

```tsx
/* 1️⃣ The ParticipantLoop uses the RoomContext to get all Participants of the room. It the uses the nested ParticipantView as a template for all participants in the loop.
 */
<ParticipantLoop>
{/* 2️⃣ The child tree is the template for every participant in the loop. */ }
 <ParticipantView>
  {/* 3️⃣ ParticipantView provides an individual ParticipantContext for every participant in the loop and ParticipantName uses this context to display the correct participant name. */}
    <ParticipantName/>
  </ ParticipantView>
<ParticipantLoop />
```

### Track Loop

The TrackLoop allows you to loop over all or a subset of tracks. You can use the sources parameter to tell the loop which track sources to include in the loop.

```tsx
 <TrackLoop sources=[Track.Source.Camera, Track.Source.ScreenShare]>
    <ParticipantView />
 <TrackLoop />
```

> **Info** how is this different from the ParticipantLoop? One participant can have more than one track. E.g. it is not uncommon to loop over all camera as well as scree share tracks.

### Filter Loops

Loops accept a filter parameter to narrow down the elements to be looped over. The filter parameter works like the standard JavaScript [Array.filter()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) function.

```tsx
/* Use the filter property to only loop over the speaking participants. */
 <ParticipantLoop sources=[Track.Source.Camera, Track.Source.ScreenShare] filter={(participant) => participant.isSpeaking}>
    <ParticipantView />
 <ParticipantLoop />
```
