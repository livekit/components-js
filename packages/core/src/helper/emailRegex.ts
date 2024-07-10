// source code adapted from https://github.com/sindresorhus/email-regex due to ESM import incompatibilities when trying to serve a CJS version of components

const regex = '[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*';

function createEmailRegExp({ exact }: { exact?: boolean } = {}) {
  return exact ? new RegExp(`^${regex}$`) : new RegExp(regex, 'g');
}
export { createEmailRegExp };
