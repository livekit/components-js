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
    return !!apiItem.fileUrlPath?.startsWith('src/components/');
  }
  return false;
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
