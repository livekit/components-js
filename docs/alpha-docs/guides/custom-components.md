# Custom Components

> **Info** In this short guide you will learn
>
> - how to use LiveKit Component hooks
> - how to create your own component

We try to offer a comprehensive set of components that allow you to build something valuable quickly. But we are aware that it would be utopian to think that a limited set of components can cover all wishes and ideas. This is why we made extensibility and customization a central part of LiveKit Components.

## React hooks

Almost every component is accompanied by a React hook with the same name, prefixed with the word `use`. For example, the `ConnectionQualityIndicator` is being built with the `useConnectionQualityIndicator` hook. The same hooks that are used to create LiveKit components can also be used for custom components.

## Custom component example

The best way to see how easy it is to create a custom component is to give a quick example. Let's create a "CustomConnectionQualityIndicator" to replace the existing "ConnectionQualityIndicator".

The default indicator uses icons to indicate how good a subscriber's connection quality is, and we could use it like this:

```tsx
//...
<ParticipantView>
  <ParticipantName />
  <ConnectionQualityIndicator />
</ParticipantView>
//...
```

This would display the name of the participant and the quality of the connection as a icon. Suppose that instead of an icon representation, we want a textual representation of the connection status. If a user Ana has a good connection quality, we want it to say "Ana has a good connection quality".

This can be easily achieved with a custom LiveKit component:

```tsx
// 1️⃣ Import the react hook.
import { useConnectionQualityIndicator } from '@livekit/components-react';

// 2️⃣ Define a custom React component.
export function CustomConnectionQualityIndicator(props: HTMLAttributes<HTMLSpanElement>) {
  /**
   *  3️⃣ By using this hook, we inherit all the state management and logic and can focus on our implementation.
   */
  const { quality } = useConnectionQualityIndicator();

  // We create a little helper function to convert the ConnectionQuality to a string.
  function qualityToText(quality: ConnectionQuality): string {
    switch (quality) {
      case ConnectionQuality.Unknown:
        return 'unknown';
      case ConnectionQuality.Poor:
        return 'poor';
      case ConnectionQuality.Good:
        return 'good';
      case ConnectionQuality.Excellent:
        return 'excellent';
    }
  }

  return <span {...props}>{` has a ${qualityToText(quality)} connection quality.`} </span>;
}
```

Now we can replace the default quality indicator with our new `CustomConnectionQualityIndicator` as follows:

```tsx
//...
<ParticipantView>
  <ParticipantName />
  {/* Custom component: Here we replace the provided <ConnectionQualityIndicator />  with our own implementation. */}
  <CustomConnectionQualityIndicator />
</ParticipantView>
//...
```

As you can see, it's super easy to create your own components in no time. 🚀

> **Info** If you want to replace a component, as we did here. Often the quickest way is to copy the current implementation and use it as a starting point for your implementation.
