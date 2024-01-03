import { SetMetadata } from '@nestjs/common';

export interface MetaScopeInfo {
  entity: string;
  accessKey: string;
}

export const MetaScope = (info: MetaScopeInfo) =>
  SetMetadata('metaScopes', info);
