import {
  ApiFunction,
  ApiItem,
  ApiVariable,
  ExcerptTokenKind,
} from '@microsoft/api-extractor-model';

export type LkType = 'component' | 'hook' | 'prefab' | undefined;
function isHook(apiItem: ApiItem): boolean {
  if (apiItem instanceof ApiFunction) {
    return apiItem.getScopedNameWithinPackage().startsWith('use');
  }
  return false;
}
function isPrefab(apiItem: ApiItem): boolean {
  if (apiItem instanceof ApiFunction) {
    return !!apiItem.fileUrlPath?.startsWith('src/prefabs/');
  }
  return false;
}

export function isNonDefaultOverload(apiItem: ApiItem): boolean {
  if (apiItem instanceof ApiFunction) {
    return apiItem.overloadIndex !== undefined && apiItem.overloadIndex > 1;
  }
  return false;
}

function isConstDeclarationComponent(apiItem: ApiItem): boolean {
  return (
    apiItem instanceof ApiVariable &&
    apiItem.isReadonly &&
    apiItem.excerptTokens.some(
      (token) =>
        (token.kind === ExcerptTokenKind.Reference &&
          ['React.ReactNode', 'React.Context'].includes(token.text)) ||
        token.text.startsWith('HTML'),
    )
  );
}

function isComponent(apiItem: ApiItem): boolean {
  if (
    apiItem instanceof ApiFunction ||
    (apiItem instanceof ApiVariable && isConstDeclarationComponent(apiItem))
  ) {
    return (
      isComponentReactPackage(apiItem) &&
      !!(
        apiItem.fileUrlPath?.startsWith('src/components/') ||
        apiItem.fileUrlPath?.startsWith('src/context/')
      ) &&
      startsWithCapitalLetter(apiItem.displayName)
    );
  }
  return false;
}

function isComponentReactPackage(apiItem: ApiItem): boolean {
  return apiItem.getAssociatedPackage()?.displayName === '@livekit/components-react';
}

function isComponentCorePackage(apiItem: ApiItem): boolean {
  return apiItem.getAssociatedPackage()?.displayName === '@livekit/components-core';
}

function startsWithCapitalLetter(name: string): boolean {
  return /^[A-Z]/.test(name);
}

/**
 *
 */
export function getFunctionType(apiItem: ApiItem): LkType {
  if (isHook(apiItem)) {
    return 'hook';
  } else if (isPrefab(apiItem)) {
    return 'prefab';
  } else if (isComponent(apiItem)) {
    return 'component';
  } else {
    return undefined;
  }
}

export function getCategorySubfolder(apiItem: ApiItem): string {
  let packagePath: string = '';
  if (isComponentCorePackage(apiItem)) {
    packagePath = 'core';
  } else if (isComponentReactPackage(apiItem)) {
    packagePath = 'react';
  }

  let category: string = '';
  const functionType = getFunctionType(apiItem);

  switch (functionType) {
    case 'component':
    case 'prefab':
      category = 'component';
      break;
    case 'hook':
      category = 'hook';
      break;
  }

  const subfolderPath: string = [packagePath, category].join('/');
  if (subfolderPath.endsWith('/')) {
    return subfolderPath;
  } else {
    return subfolderPath + '/';
  }
}

function getPackageSrcBaseUrl(apiItem: ApiItem) {
  const urlBase = 'https://github.com/livekit/components-js/blob/main/packages' as const;
  if (isComponentCorePackage(apiItem)) {
    return `${urlBase}/core` as const;
  } else if (isComponentReactPackage(apiItem)) {
    return `${urlBase}/react` as const;
  } else {
    throw new Error('Unknown package');
  }
}

export function getLinkToSourceOnGitHub(apiItem: ApiItem) {
  if ('fileUrlPath' in apiItem && apiItem.fileUrlPath) {
    const packageSrcBaseUrl = getPackageSrcBaseUrl(apiItem);
    return `${packageSrcBaseUrl}/${apiItem.fileUrlPath}`;
  }
  return undefined;
}
