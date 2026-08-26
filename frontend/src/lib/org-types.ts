export const ORG_TYPES = [
  'HEAD_OFFICE',
  'MASTER_DISTRIBUTOR',
  'REGIONAL_BRANCH',
  'AGENCY',
  'SALES_OFFICE',
] as const;

export type OrgTypeCode = (typeof ORG_TYPES)[number];

export function allowedChildTypes(parentType: string | null | undefined): OrgTypeCode[] {
  if (!parentType) return ['HEAD_OFFICE'];
  switch (parentType) {
    case 'HEAD_OFFICE':
      return ['HEAD_OFFICE', 'MASTER_DISTRIBUTOR'];
    case 'MASTER_DISTRIBUTOR':
      return ['REGIONAL_BRANCH'];
    case 'REGIONAL_BRANCH':
      return ['AGENCY'];
    case 'AGENCY':
      return ['SALES_OFFICE'];
    default:
      return [];
  }
}

export function orgDepth(path?: string | null): number {
  if (!path) return 0;
  return path.split('/').filter(Boolean).length;
}
