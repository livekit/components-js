// source code adapted from https://github.com/sindresorhus/email-regex due to ESM import incompatibilities when trying to serve a CJS version of components

// the local part is capped at 256 characters (an address allows 64): without a cap, every start in
// a long word with no `@` in it rescans the rest of the word
const regex = '[^\\.\\s@:](?:[^\\s@:]{0,254}[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*';

function createEmailRegExp({ exact }: { exact?: boolean } = {}) {
  return exact ? new RegExp(`^${regex}$`) : new RegExp(regex, 'g');
}
export { createEmailRegExp };
