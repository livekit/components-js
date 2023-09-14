type OptionUndefined = undefined;
type OptionEnsureFalse = { ensure: false };
type OptionEnsureWithContext<ContextType> = ContextType;

export type ContextHookOptions<ContextType> =
  | OptionUndefined
  | OptionEnsureFalse
  | OptionEnsureWithContext<ContextType>;

export type ContextHookReturnType<Option, ContextType> = Option extends OptionUndefined
  ? ContextType
  : Option extends OptionEnsureWithContext<ContextType>
  ? ContextType
  : Option extends OptionEnsureFalse
  ? ContextType | undefined
  : never;

export function isEnsureFalse(options: unknown): options is OptionEnsureFalse {
  return (
    options !== undefined &&
    options !== null &&
    typeof options === 'object' &&
    options.hasOwnProperty('ensure') &&
    'ensure' in options &&
    options.ensure === false
  );
}

export function isEnsureTrue(options: unknown): options is OptionEnsureFalse {
  return (
    options !== undefined &&
    options !== null &&
    typeof options === 'object' &&
    'ensure' in options &&
    options.ensure === true
  );
}

export function isEnsureContext<ContextType>(
  options: ContextHookOptions<ContextType>,
): options is OptionEnsureWithContext<ContextType> {
  return !isEnsureFalse(options);
}

// export function isMaybeContextInput<ContextType>(
//   options: HookContextOptions<ContextType>,
// ): options is OptionEnsureFalse {
//   return (
//     options !== undefined &&
//     options !== null &&
//     typeof options === 'object' &&
//     'ensure' in options &&
//     options.ensure === false
//   );
// }

// export function isEnsureContextInput<ContextType>(
//   options: HookContextOptions<ContextType>,
// ): options is OptionEnsureContext<ContextType> {
//   return (
//     options === undefined ||
//     (typeof options === 'object' &&
//       options !== null &&
//       'ensure' in options &&
//       options.ensure === true) ||
//     typeof options === 'object'
//   );
// }
