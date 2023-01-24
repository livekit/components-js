import ipRegex from 'ip-regex';
import tlds from 'tlds';

interface RegExOptions {
  /**
		Only match an exact string. Useful with `RegExp#test` to check if a string is a URL.
		@default false
		*/
  readonly exact?: boolean;

  /**
		Force URLs to start with a valid protocol or `www`. If set to `false` it'll match the TLD against a list of valid [TLDs](https://github.com/stephenmathieson/node-tlds).
		@default true
		*/
  readonly strict?: boolean;
}

export const createUrlRegExp = (options: RegExOptions) => {
  options = {
    strict: true,
    ...options,
  };

  const protocol = `(?:(?:[a-z]+:)?//)${options.strict ? '' : '?'}`;
  const auth = '(?:\\S+(?::\\S*)?@)?';
  const ip = ipRegex.v4().source;
  const host = '(?:(?:[a-z\\u00a1-\\uffff0-9][-_]*)*[a-z\\u00a1-\\uffff0-9]+)';
  const domain = '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*';
  const tld = `(?:\\.${
    options.strict
      ? '(?:[a-z\\u00a1-\\uffff]{2,})'
      : `(?:${tlds.sort((a, b) => b.length - a.length).join('|')})`
  })\\.?`;
  const port = '(?::\\d{2,5})?';
  const path = '(?:[/?#][^\\s"]*)?';
  const regex = `(?:${protocol}|www\\.)${auth}(?:localhost|${ip}|${host}${domain}${tld})${port}${path}`;

  return options.exact ? new RegExp(`(?:^${regex}$)`, 'i') : new RegExp(regex, 'ig');
};
