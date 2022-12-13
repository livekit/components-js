import * as React from 'react';
import { SVGProps } from 'react';
const SvgMicIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={12} height={16} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M.975 8.002a.5.5 0 0 1 .547.449 4.5 4.5 0 0 0 8.956 0 .5.5 0 1 1 .995.098A5.502 5.502 0 0 1 6.5 13.478V15h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-1.522A5.502 5.502 0 0 1 .527 8.549a.5.5 0 0 1 .448-.547Z"
      fill="#000"
    />
    <path d="M3 3a3 3 0 1 1 6 0v5a3 3 0 0 1-6 0V3Z" fill="#000" />
  </svg>
);
export default SvgMicIcon;
