# Styling LiveKit Components

You will learn:

- how to override or extend the styling of existing LiveKit components
- how to change the global color palette

## Our approach to styling

All LiveKit components come with carefully designed and beautiful styles that you can use right out of the box. If you're happy with the default styles, that's perfect, but if not, we've got you covered too! We do everything we can to give you the freedom to simply override, extend and change the styles to your liking.

## Style LiveKit Components like a HTML Element

Almost all LiveKit components are built on a basic HTML element. For example, the `TrackMutedIndicator` component is just a div with some hooks that deal with status (e.g. whether a camera track is muted or not). This means that you can treat the `TrackMutedIndicator` component like a div and pass `className` or `style` properties to apply styling.

```tsx
// Apply custom styling like you would with a regular div element.
<TrackMutedIndictor className="your-classes" style={{ padding: '1rem' }} />
```

## Change global color pallet

All components share a small but carefully selected color palette. Each color from the palette is saved as a CSS custom property (CSS variable). You can find the palette [here](../../../packages/styles/scss/_root.scss). Override them as you normally would with CSS custom properties to customize them to your liking.

```css
/* Excerpt of the color palette  */
:root {
  --fg: #111;
  --fg-secondary: #333;
  --fg-tertiary: #555;

  --bg: #fff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #fafafa;

  --accent-fg: #fff;
  --accent-bg: #1f8cf9;

  --danger-fg: #fff;
  --danger: #f91f31;
  --danger-text: #6d0311;
  --danger-bg: #fecdd4;

  --success-fg: #fff;
  --success: #1ff968;
  --success-text: #036d26;
  --success-bg: #cdfedd;

  --control-fg: var(--fg);
  --control-bg: var(--bg-secondary);

  --connection-excellent: #06db4d;
  --connection-good: #f9b11f;
  --connection-poor: #f91f31;
  ...
```

## Use of HTML custom data attributes in LiveKit Components

[Custom data attributes](https://developer.mozilla.org/en-US/docs/Learn/HTML/Howto/Use_data_attributes) are an easy way to store additional information on standard HTML elements. We use data attributes on many elements to show what state the component is in, or to provide additional information that can be used for styling.

> **Info** All data attributes in LiveKit Components start with `data-lk-`

For example, the `ConnectionQualityIndicator` shows the connection quality of a participant. The component renders an HTML div element and we add the custom data attribute `data-lk-quality` to it. The value of the custom data attribute is updated according to the current connection quality and can take the values "unknown", " poor", "good" and "excellent".

```tsx
// Participant with a excellent connection.
<div data-lk-quality="excellent">
  {/* ... */}
</div>

// Participant with a excellent poor.
<div data-lk-quality="poor">
  {/* ... */}
</div>
```

The data attributes are simple HTML attributes, so we can access them via CSS. For example, to update the ConnectionQualityIndicator background, we can use the attribute selector to change the styles according to the value of the data attribute:

```css
[data-lk-quality='excellent'] {
  background-color: green;
}
[data-lk-quality='poor'] {
  background-color: red;
}
```

> **Warning** Currently it is not documented which data attribute is used for which component. At the moment it is best to open the inspector and check which data attribute is used.
