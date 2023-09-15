type OptionUndefined = undefined;
type OptionEnsureFalse = { ensure: false };
type OptionEnsureWithContext<ContextType> = ContextType;

export type ContextHookOptions<ContextTyp> =
  | OptionUndefined
  | OptionEnsureFalse
  | OptionEnsureWithContext<ContextTyp>;

export type ConditionalReturnType<ContextType, T> = T extends OptionUndefined | ContextType
  ? ContextType
  : T extends OptionEnsureFalse
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

export function isEnsureContext<ContextType>(
  options: ContextHookOptions<ContextType>,
): options is OptionEnsureWithContext<ContextType> {
  return !isEnsureFalse(options);
}
