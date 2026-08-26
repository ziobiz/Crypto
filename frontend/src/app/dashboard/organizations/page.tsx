'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { OrgCreateFields } from '@/components/orgs/OrgCreateFields';
import { DoubleConfirmDialog } from '@/components/DoubleConfirmDialog';
import { api, type Organization } from '@/lib/api';
import type { MessageKey } from '@/i18n/messages';
import { type OrgTypeCode } from '@/lib/org-types';
import { detailRowProps } from '@/lib/table-row-detail';

export default function OrganizationsPage() {
  const { user: me } = useAuth();
  const t = useT();
  const isSuperAdmin = me?.role === 'SUPER_ADMIN';
  const orgTypeLabel = (type: string) => t(`org.${type}` as MessageKey);

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<OrgTypeCode>('MASTER_DISTRIBUTOR');
  const [parentId, setParentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [deleting, setDeleting] = useState<Organization | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrgs(await api.organizations(true));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setType(isSuperAdmin ? 'HEAD_OFFICE' : 'REGIONAL_BRANCH');
    setParentId('');
    setName('');
    setModal('create');
    setMsg('');
  }

  function openEdit(org: Organization) {
    setEditing(org);
    setName(org.name);
    setIsActive(org.isActive !== false);
    setModal('edit');
    setMsg('');
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    try {
      await api.createOrganization({
        name,
        type,
        parentId: parentId || null,
      });
      setModal(null);
      setMsg(t('orgs.created'));
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('orgs.createFailed'));
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setMsg('');
    try {
      await api.updateOrganization(editing.id, { name, isActive });
      setModal(null);
      setMsg(t('orgs.saved'));
      load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : t('common.saveFailed'));
    }
  }

  async function confirmDeleteOrg() {
    if (!deleting) return;
    setMsg('');
    try {
      await api.deleteOrganization(deleting.id);
      setDeleting(null);
      setMsg(t('orgs.deleted'));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('orgs.deleteFailed'));
      setDeleting(null);
    }
  }

  return (
    <div className="pg-stack">
      <div className="pg-toolbar">
        <p className="pg-hint">{t('orgs.subtitle')}</p>
        <button type="button" onClick={openCreate} className="pg-btn pg-btn-primary">
          {t('orgs.add')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && modal === null && <p className="pg-hint">{msg}</p>}

      <div className="pg-card pg-table-wrap">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('orgs.col.name')}</th>
              <th>{t('orgs.col.code')}</th>
              <th>{t('orgs.col.type')}</th>
              <th>{t('orgs.parent')}</th>
              <th>{t('users.col.status')}</th>
              <th>{t('users.col.actions')}</th>
              <th>{t('users.col.note')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="pg-hint">
                  {t('common.loading')}
                </td>
              </tr>
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={7} className="pg-hint">
                  {t('orgs.empty')}
                </td>
              </tr>
            ) : (
              orgs.map((o) => (
                <tr key={o.id} {...detailRowProps(t('table.dblclickHint'), () => openEdit(o))}>
                  <td className="text-center">{o.name}</td>
                  <td className="text-center">{o.code}</td>
                  <td className="text-center">{orgTypeLabel(o.type)}</td>
                  <td className="text-center">{o.parent ? o.parent.name : '—'}</td>
                  <td className="text-center">
                    <span className={`pg-badge ${o.isActive === false ? 'pg-badge-muted' : 'pg-badge-success'}`}>
                      {o.isActive === false ? t('users.inactive') : t('users.active')}
                    </span>
                  </td>
                  <td className="text-center">
                    <button type="button" className="pg-action-chip pg-action-chip-edit" onClick={() => openEdit(o)}>
                      {t('users.edit')}
                    </button>
                  </td>
                  <td className="text-center">
                    <button type="button" className="pg-action-chip pg-action-chip-danger" onClick={() => setDeleting(o)}>
                      {t('orgs.delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal === 'create' && (
        <div className="pg-modal-overlay">
          <form onSubmit={handleCreate} className="pg-modal">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('orgs.createTitle')}</h2>
            </div>
            <div className="pg-modal-body">
              <p className="pg-hint mb-3">{t('orgs.hierarchyHint')}</p>
              <OrgCreateFields
                orgs={orgs}
                type={type}
                parentId={parentId}
                name={name}
                onType={setType}
                onParentId={setParentId}
                onName={setName}
                allowRootHq={isSuperAdmin}
              />
            </div>
            {msg && <p className="pg-callout pg-callout-error mx-6 mb-0">{msg}</p>}
            <div className="pg-modal-foot">
              <button type="button" onClick={() => setModal(null)} className="pg-btn pg-btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" className="pg-btn pg-btn-primary">
                {t('common.register')}
              </button>
            </div>
          </form>
        </div>
      )}

      {modal === 'edit' && editing && (
        <div className="pg-modal-overlay">
          <form onSubmit={handleUpdate} className="pg-modal">
            <div className="pg-modal-head">
              <h2 className="pg-modal-title">{t('orgs.editTitle')}</h2>
              <p className="pg-modal-sub">
                {editing.code} · {orgTypeLabel(editing.type)}
              </p>
            </div>
            <div className="pg-modal-body">
              <label className="pg-field">
                <span className="pg-field-label">{t('orgs.col.name')}</span>
                <div className="mt-1">
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="pg-input" />
                </div>
              </label>
              <label className="pg-field flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>{t('orgs.active')}</span>
              </label>
            </div>
            {msg && <p className="pg-callout pg-callout-error mx-6 mb-0">{msg}</p>}
            <div className="pg-modal-foot">
              <button type="button" onClick={() => setModal(null)} className="pg-btn pg-btn-secondary">
                {t('common.cancel')}
              </button>
              <button type="submit" className="pg-btn pg-btn-primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <DoubleConfirmDialog
          title={t('orgs.deleteTitle')}
          step1={t('orgs.deleteStep1', { name: deleting.name })}
          step2={t('orgs.deleteStep2', { name: deleting.name })}
          onConfirm={confirmDeleteOrg}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
