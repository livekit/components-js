# About LiveKit Components

LiveKit Components give you a declarative way to build your real-time LiveKit audio/video frontend with React.

Every use case is different and apps in the real world are individual and unique. We don't pretend to have the perfect solution that fits all use cases. Instead, we've taken an approach where we give you reasonable defaults, without taking away full control over each component if you want it.

## 🤩 We handle LiveKit state for you

You don't have to worry about participant or room events to update the state of your application. All components handle state management for you, and by using React contexts, you don't have to route properties through your component tree.

## 🛠️ Carefully crafted set of components

We offer all the necessary building blocks to build a live video or audio app in no time.

## 🚀 Beautiful and sane defaults

We put a lot of effort into creating components that work and look great right out of the gate. Get started quickly by using the defaults of your components or overwrite them by simply adding children.

```tsx
//1️⃣ Use the components defaults to render a video conference app
<LiveKitRoom />

// 2️⃣ or overwrite the defaults with your custom component tree.
<LiveKitRoom >
  <ParticipantLoop>
    {/*  */}
  </ParticipantLoop>
</LiveKitRoom>

```

## 🎨 Style them like you want

Because most of the components are merely wrappers around standard HTML-Elements you can overwrite the basic component style how ever you want.

Many components come with variations so you can choose what look fits your app the best. On top of that there is a global colors pallet to LiveKit Components so you can easily adjust the theming to your needs.

## 📈 Room to grow: create your own components

The component we offer does not fit your requirements? We have the solution for you! Each component comes with its own React hook that allows you to create your own component with minimal boilerplate. Of course, you can also combine your own component with our pre-built components. It's common to start with our components to quickly sketch out a concept, and then replace some of them with your own components to build something we could never have imagined.
