import * as React from 'react';
import { SVGProps } from 'react';
const SvgMicIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="currentColor" {...props}>
    <path
      fillRule="evenodd"
      d="M2.975 8.002a.5.5 0 0 1 .547.449 4.5 4.5 0 0 0 8.956 0 .5.5 0 1 1 .995.098A5.502 5.502 0 0 1 8.5 13.478V15h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.522a5.502 5.502 0 0 1-4.973-4.929.5.5 0 0 1 .448-.547z"
      clipRule="evenodd"
    />
    <path d="M5 3a3 3 0 1 1 6 0v5a3 3 0 0 1-6 0z" />
  </svg>
);
export default SvgMicIcon;
