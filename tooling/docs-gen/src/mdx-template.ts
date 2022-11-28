import { ComponentDoc } from 'react-docgen-typescript';

export const mdxComponentTemplate = (def: ComponentDoc, hasHook: boolean) => `---
title: ${splitCamelCase(def.displayName)}
subtitle: ${def.description.replaceAll('\n', ' ')} 
---

${autogeneratedFileWarning}

import Usage from '@/components/js-components/Usage';
import PropsTable from '@/components/js-components/PropsTable';
${addHookImport(def.displayName, hasHook)}

## Usage

${addImportExample(def.displayName)}

${def.tags?.example ? def.tags.example : 'No example yet.'}

<Usage of='${def.displayName}' />

## Props

<PropsTable data='${JSON.stringify(def.props, stringifyProps)}' />

${renderHook(def.displayName, hasHook)}
`;

const addHookImport = (displayName: string, hasHook: boolean) =>
  hasHook ? `import Use${displayName} from './use${displayName}.mdx';` : '';
const renderHook = (displayName: string, hasHook: boolean) =>
  hasHook ? `<Use${displayName} />` : '';

export const mdxHookTemplate = (def: ComponentDoc) => `---
noLayout: true
---

${autogeneratedFileWarning}

import Usage from '@/components/js-components/Usage';
import PropsTable from '@/components/js-components/PropsTable';

## ${def.displayName} Hook

${def.description.replaceAll('\n', ' ')} 

### Hook Usage

${addImportExample(def.displayName)}

${def.tags?.example ? def.tags.example : 'No example yet.'}

<Usage of='${def.displayName}' />

### Hook Props

<PropsTable data='${JSON.stringify(def.props, stringifyProps)}' />
`;

const addImportExample = (displayName: string) =>
  '```tsx\n' + 'import { ' + displayName + " } from '@livekit/components-react'\n```";

const splitCamelCase = (camelCaseStr: string) =>
  camelCaseStr.replace(/([a-z0-9])([A-Z])/g, '$1 $2');

const stringifyProps = (key: string, value: any) => {
  if (key === 'defaultValue') {
    // TODO: some `defaultValues` are in a non JSON compatible format and crash when trying to run JSON.parse on them.
    // At the moment we exclude them from the JSON string.
    return typeof value === 'object' ? null : value;
  }
  return value;
};

const autogeneratedFileWarning = `{/*
!!!! Autogenerated File !!!!
This file was created by @livekit/components-docs-gen and should not be changed manually.
The contents of this file can be replaced at any time which would lead to the loss of all manual changes.
*/}`;
