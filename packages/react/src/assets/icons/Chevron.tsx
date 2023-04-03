import * as React from 'react';
import { SVGProps } from 'react';
const SvgChevron = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} fill="none" {...props}>
    <path
      fill="currentcolor"
      fillRule="evenodd"
      d="M5.293 2.293a1 1 0 0 1 1.414 0l4.823 4.823a1.25 1.25 0 0 1 0 1.768l-4.823 4.823a1 1 0 0 1-1.414-1.414L9.586 8 5.293 3.707a1 1 0 0 1 0-1.414z"
      clipRule="evenodd"
    />
  </svg>
);
export default SvgChevron;
