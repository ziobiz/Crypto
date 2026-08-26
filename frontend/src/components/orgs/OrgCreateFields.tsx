'use client';

import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';
import type { Organization } from '@/lib/api';
import { ORG_TYPES, allowedChildTypes, type OrgTypeCode } from '@/lib/org-types';

export function OrgCreateFields({
  orgs,
  type,
  parentId,
  name,
  onType,
  onParentId,
  onName,
  allowRootHq,
}: {
  orgs: Organization[];
  type: string;
  parentId: string;
  name: string;
  onType: (v: OrgTypeCode) => void;
  onParentId: (v: string) => void;
  onName: (v: string) => void;
  allowRootHq: boolean;
}) {
  const t = useT();
  const orgTypeLabel = (code: string) => t(`org.${code}` as MessageKey);
  const creatableTypes = ORG_TYPES.filter((code) => {
    if (code === 'HEAD_OFFICE' && allowRootHq) return true;
    return orgs.some((o) => o.isActive !== false && allowedChildTypes(o.type).includes(code));
  });
  const typeOptions = creatableTypes.length > 0 ? creatableTypes : ORG_TYPES;
  const parentCandidates = orgs.filter(
    (o) => o.isActive !== false && allowedChildTypes(o.type).includes(type as OrgTypeCode),
  );
  const parentRequired = !(type === 'HEAD_OFFICE' && allowRootHq);

  return (
    <>
      <label className="pg-field">
        <span className="pg-field-label">
          {t('orgs.col.type')}
          <span className="pg-field-required"> *</span>
        </span>
        <div className="mt-1">
          <select
            required
            value={type}
            onChange={(e) => onType(e.target.value as OrgTypeCode)}
            className="pg-input"
          >
            {typeOptions.map((code) => (
              <option key={code} value={code}>
                {orgTypeLabel(code)}
              </option>
            ))}
          </select>
        </div>
      </label>
      <label className="pg-field">
        <span className="pg-field-label">
          {t('orgs.parent')}
          {parentRequired && <span className="pg-field-required"> *</span>}
        </span>
        <div className="mt-1">
          <select
            required={parentRequired}
            value={parentId}
            onChange={(e) => onParentId(e.target.value)}
            className="pg-input"
          >
            <option value="">{parentRequired ? t('users.select') : t('orgs.noParent')}</option>
            {parentCandidates.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.code}) · {orgTypeLabel(o.type)}
              </option>
            ))}
          </select>
        </div>
      </label>
      <label className="pg-field">
        <span className="pg-field-label">
          {t('orgs.col.name')}
          <span className="pg-field-required"> *</span>
        </span>
        <div className="mt-1">
          <input
            required
            value={name}
            onChange={(e) => onName(e.target.value)}
            className="pg-input"
            placeholder={t('orgs.namePlaceholder')}
          />
        </div>
      </label>
    </>
  );
}
