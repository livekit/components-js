// The MIT License (MIT)

// Copyright (c) Kevin Mårtensson <kevinmartensson@gmail.com> and Diego Perini

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

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
