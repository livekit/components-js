import * as React from 'react';
import { SVGProps } from 'react';
const SvgParticipantPlaceholder = (props: SVGProps<SVGSVGElement>) => (
  <svg width={320} height={320} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M160 180a80 80 0 1 0 0-160 80 80 0 0 0 0 160Zm-62.3 14.6a20.6 20.6 0 0 1 17.8.5 104.6 104.6 0 0 0 89 0 20.6 20.6 0 0 1 17.8-.5 140.1 140.1 0 0 1 76.3 105.5C300 311 291 320 280 320H40c-11 0-20.2-9-18.6-20a140.1 140.1 0 0 1 76.3-105.4Z"
      fill="currentColor"
    />
  </svg>
);
export default SvgParticipantPlaceholder;
