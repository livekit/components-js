import { ApiAbstractMixin, ApiFunction, ApiItem } from '@microsoft/api-extractor-model';

export type LkType = 'component' | 'hook' | 'prefab' | undefined;
function isHook(apiItem: ApiItem): boolean {
  return apiItem.displayName.startsWith('use');
}
function isPrefab(apiItem: ApiItem): boolean {
  if (apiItem instanceof ApiFunction) {
    return !!apiItem.fileUrlPath?.startsWith('src/prefabs/');
  }
  return false;
}
function isComponent(apiItem: ApiItem): boolean {
  if (apiItem instanceof ApiFunction) {
    return isComponentReactPackage(apiItem) && !!apiItem.fileUrlPath?.startsWith('src/components/');
  }
  return false;
}

function isComponentReactPackage(apiItem: ApiItem): boolean {
  return apiItem.getAssociatedPackage()?.displayName === '@livekit/components-react';
}

function isComponentCorePackage(apiItem: ApiItem): boolean {
  return apiItem.getAssociatedPackage()?.displayName === '@livekit/components-core';
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
  switch (getFunctionType(apiItem)) {
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
