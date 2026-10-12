'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  defaultMemberGradePolicy,
  hqPolicyApi,
  type HqMemberGradePolicy,
  type MethodTransactionLimitsPolicy,
  type PaidMembershipLimitsPolicy,
} from '@/lib/api';
import { ensureTransactionLimits } from '@/lib/hq-commission-shared';
import { MemberGradePolicyEditor } from '@/components/hq-policy/MemberGradePolicyEditor';
import {
  defaultPaidMembershipLimitsPolicyUi,
  PaidMembershipLimitsEditor,
} from '@/components/hq-policy/PaidMembershipLimitsEditor';

export default function MembershipAdminBenefitsPage() {
  const t = useT();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [memberGrade, setMemberGrade] = useState<HqMemberGradePolicy>(defaultMemberGradePolicy());
  const [paidLimits, setPaidLimits] = useState<PaidMembershipLimitsPolicy>(
    defaultPaidMembershipLimitsPolicyUi(),
  );
  const [generalLimits, setGeneralLimits] = useState<MethodTransactionLimitsPolicy | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((c) => {
        setMemberGrade(c.memberGrade ?? defaultMemberGradePolicy());
        setPaidLimits(c.paidMembershipLimits ?? defaultPaidMembershipLimitsPolicyUi());
        const risk = ensureTransactionLimits(c.risk);
        setGeneralLimits(risk.methodTransactionLimits ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : t('common.loadFailed')));
  }, [t]);

  function saveExpress() {
    requestConfirm({
      title: t('paidMembership.hq.saveExpress'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingGrade(true);
        setMsg('');
        try {
          const next = await hqPolicyApi.saveMemberGrade(memberGrade);
          setMemberGrade(next.memberGrade ?? memberGrade);
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingGrade(false);
        }
      },
    });
  }

  function saveLimits() {
    requestConfirm({
      title: t('paidMembership.saveLimits'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingLimits(true);
        setMsg('');
        try {
          const next = await hqPolicyApi.savePaidMembershipLimits(paidLimits);
          setPaidLimits(next.paidMembershipLimits ?? paidLimits);
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingLimits(false);
        }
      },
    });
  }

  if (error) {
    return (
      <p className="text-red-600">
        {error} — {t('hq.backendHint')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {doubleConfirmDialog}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          {t('paidMembership.hq.expressTitle')}
        </h2>
        <p className="pg-hint text-sm">{t('paidMembership.hq.expressDesc')}</p>
        <MemberGradePolicyEditor value={memberGrade} onChange={setMemberGrade} />
        <button
          type="button"
          className="pg-btn pg-btn-primary text-xs"
          disabled={savingGrade}
          onClick={saveExpress}
        >
          {savingGrade ? t('hq.saving') : t('paidMembership.hq.saveExpress')}
        </button>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">{t('paidMembership.limitsTitle')}</h2>
        <PaidMembershipLimitsEditor
          value={paidLimits}
          onChange={setPaidLimits}
          generalLimits={generalLimits}
          onCopied={setMsg}
        />
        <button
          type="button"
          className="pg-btn pg-btn-primary text-xs"
          disabled={savingLimits}
          onClick={saveLimits}
        >
          {savingLimits ? t('hq.saving') : t('paidMembership.saveLimits')}
        </button>
      </section>
      {msg && <p className="pg-hint">{msg}</p>}
    </div>
  );
}
