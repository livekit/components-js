type OptionUndefined = undefined;
type OptionEnsureWithContext<ContextType> = ContextType;
type OptionMaybeUndefined = { maybeUndefined: true };

export type ContextHookOptions<ContextType> =
  | OptionUndefined
  | OptionEnsureWithContext<ContextType>
  | OptionMaybeUndefined;

export type ConditionalReturnType<ContextType, O> = O extends
  | OptionUndefined
  | OptionEnsureWithContext<ContextType>
  ? ContextType
  : O extends OptionMaybeUndefined
  ? ContextType | undefined
  : never;

export function isMaybeUndefined<ContextType>(
  options: ContextHookOptions<ContextType>,
): options is OptionMaybeUndefined {
  return (
    options !== undefined &&
    options !== null &&
    typeof options === 'object' &&
    options.hasOwnProperty('maybeUndefined') &&
    'maybeUndefined' in options &&
    options.maybeUndefined === true
  );
}

export function isEnsureContext<ContextType>(
  options: ContextHookOptions<ContextType>,
): options is OptionEnsureWithContext<ContextType> {
  return !isMaybeUndefined(options);
}
