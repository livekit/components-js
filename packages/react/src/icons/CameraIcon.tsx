import * as React from 'react';
import { SVGProps } from 'react';
const SvgCameraIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width={16} height={16} fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="m0 4.5c0-.82843.671573-1.5 1.5-1.5h8c.8284 0 1.5.67157 1.5 1.5v7c0 .8284-.6716 1.5-1.5 1.5h-8c-.828427 0-1.5-.6716-1.5-1.5z"/>
    <path d="m15.2 3.6-2.8 2.1c-.2518.18885-.4.48524-.4.8v3c0 .31476.1482.6111.4.8l2.8 2.1c.3296.2472.8.012.8-.4v-8c0-.41202-.4704-.64721-.8-.4z"/>
  </svg>
);
export default SvgCameraIcon;
