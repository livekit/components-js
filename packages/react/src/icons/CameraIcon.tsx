import * as React from 'react';
import { SVGProps } from 'react';
const SvgCameraIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={16} height={10} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M0 1.5A1.5 1.5 0 0 1 1.5 0h8A1.5 1.5 0 0 1 11 1.5v7A1.5 1.5 0 0 1 9.5 10h-8A1.5 1.5 0 0 1 0 8.5v-7ZM15.2.6l-2.8 2.1a1 1 0 0 0-.4.8v3a1 1 0 0 0 .4.8l2.8 2.1A.5.5 0 0 0 16 9V1a.5.5 0 0 0-.8-.4Z"
      fill="#000"
    />
  </svg>
);
export default SvgCameraIcon;
