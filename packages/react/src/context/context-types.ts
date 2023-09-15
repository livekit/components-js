type OptionUndefined = undefined;
type OptionEnsureFalse = { maybeUndefined: true };
type OptionEnsureWithContext<ContextType> = ContextType;

export type ContextHookOptions<ContextType> =
  | OptionUndefined
  | OptionEnsureFalse
  | OptionEnsureWithContext<ContextType>;

export type ConditionalReturnType<ContextType, O> = O extends
  | OptionUndefined
  | OptionEnsureWithContext<ContextType>
  ? ContextType
  : O extends OptionEnsureFalse
  ? ContextType | undefined
  : never;

export function isEnsureFalse<ContextType>(
  options: ContextHookOptions<ContextType>,
): options is OptionEnsureFalse {
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
  return !isEnsureFalse(options);
}
