'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { useDoubleConfirm } from '@/hooks/useDoubleConfirm';
import {
  defaultMemberGradePolicy,
  defaultPaidMembershipExpressQuotasPolicy,
  defaultPaidMembershipProductsPolicy,
  hqPolicyApi,
  normalizePaidMembershipExpressQuotasPolicyUi,
  normalizePaidMembershipProductsPolicyUi,
  type HqMemberGradePolicy,
  type MethodTransactionLimitsPolicy,
  type PaidMembershipExpressQuotasPolicy,
  type PaidMembershipLimitsPolicy,
  type PaidMembershipProductsPolicy,
} from '@/lib/api';
import { ensureTransactionLimits } from '@/lib/hq-commission-shared';
import { MemberGradePolicyEditor } from '@/components/hq-policy/MemberGradePolicyEditor';
import {
  defaultPaidMembershipLimitsPolicyUi,
  PaidMembershipLimitsEditor,
} from '@/components/hq-policy/PaidMembershipLimitsEditor';
import { PaidMembershipExpressQuotasEditor } from '@/components/hq-policy/PaidMembershipExpressQuotasEditor';
import { PaidMembershipPresetPanel } from '@/components/hq-policy/PaidMembershipPresetPanel';
import {
  buildExpressQuotasFromPreset,
  buildMemberGradeFromPreset,
  buildPaidLimitsFromPreset,
  buildProductsFromPreset,
  detectAppliedPaidMembershipPreset,
  type PaidMembershipPresetId,
} from '@/lib/paid-membership-presets';

export default function MembershipAdminBenefitsPage() {
  const t = useT();
  const { requestConfirm, dialog: doubleConfirmDialog } = useDoubleConfirm();
  const [memberGrade, setMemberGrade] = useState<HqMemberGradePolicy>(defaultMemberGradePolicy());
  const [paidLimits, setPaidLimits] = useState<PaidMembershipLimitsPolicy>(
    defaultPaidMembershipLimitsPolicyUi(),
  );
  const [expressQuotas, setExpressQuotas] = useState<PaidMembershipExpressQuotasPolicy>(
    defaultPaidMembershipExpressQuotasPolicy(),
  );
  const [products, setProducts] = useState<PaidMembershipProductsPolicy>(
    defaultPaidMembershipProductsPolicy(),
  );
  const [generalLimits, setGeneralLimits] = useState<MethodTransactionLimitsPolicy | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [savingQuotas, setSavingQuotas] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState<PaidMembershipPresetId | null>(null);
  const [appliedPreset, setAppliedPreset] = useState<PaidMembershipPresetId | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getCommission()
      .then((c) => {
        const nextGrade = c.memberGrade ?? defaultMemberGradePolicy();
        const nextLimits = c.paidMembershipLimits ?? defaultPaidMembershipLimitsPolicyUi();
        const nextQuotas = normalizePaidMembershipExpressQuotasPolicyUi(
          c.paidMembershipExpressQuotas ?? defaultPaidMembershipExpressQuotasPolicy(),
        );
        const nextProducts = normalizePaidMembershipProductsPolicyUi(
          c.paidMembershipProducts ?? defaultPaidMembershipProductsPolicy(),
        );
        setMemberGrade(nextGrade);
        setPaidLimits(nextLimits);
        setExpressQuotas(nextQuotas);
        setProducts(nextProducts);
        const risk = ensureTransactionLimits(c.risk);
        setGeneralLimits(risk.methodTransactionLimits ?? null);

        const detected = detectAppliedPaidMembershipPreset({
          products: nextProducts,
          expressQuotas: nextQuotas,
          memberGrade: nextGrade,
        });
        setAppliedPreset(detected);
        try {
          if (detected) sessionStorage.setItem('paidMembership.appliedPreset', detected);
          else sessionStorage.removeItem('paidMembership.appliedPreset');
        } catch {
          /* ignore */
        }
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

  function saveQuotas() {
    requestConfirm({
      title: t('paidMembership.quota.save'),
      step1: t('common.doubleConfirm.step1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('common.save'),
      onConfirm: async () => {
        setSavingQuotas(true);
        setMsg('');
        try {
          const next = await hqPolicyApi.savePaidMembershipExpressQuotas(expressQuotas);
          setExpressQuotas(
            normalizePaidMembershipExpressQuotasPolicyUi(
              next.paidMembershipExpressQuotas ?? expressQuotas,
            ),
          );
          setMsg(t('hq.saved'));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setSavingQuotas(false);
        }
      },
    });
  }

  function applyPreset(id: PaidMembershipPresetId) {
    requestConfirm({
      title: t('paidMembership.preset.applyConfirmTitle', { id }),
      step1: t('paidMembership.preset.applyConfirmStep1'),
      step2: t('common.doubleConfirm.step2'),
      confirmLabel: t('paidMembership.preset.apply', { id }),
      onConfirm: async () => {
        setApplyingPreset(id);
        setMsg('');
        try {
          const nextGrade = buildMemberGradeFromPreset(id);
          const nextLimits = buildPaidLimitsFromPreset(id, generalLimits);
          const nextProducts = buildProductsFromPreset(id, products);
          const nextQuotas = buildExpressQuotasFromPreset(id);

          const savedGrade = await hqPolicyApi.saveMemberGrade(nextGrade);
          const savedLimits = await hqPolicyApi.savePaidMembershipLimits(nextLimits);
          const savedProducts = await hqPolicyApi.savePaidMembershipProducts(nextProducts);
          const savedQuotas = await hqPolicyApi.savePaidMembershipExpressQuotas(nextQuotas);

          setMemberGrade(savedGrade.memberGrade ?? nextGrade);
          setPaidLimits(savedLimits.paidMembershipLimits ?? nextLimits);
          setProducts(
            normalizePaidMembershipProductsPolicyUi(
              savedProducts.paidMembershipProducts ?? nextProducts,
            ),
          );
          setExpressQuotas(
            normalizePaidMembershipExpressQuotasPolicyUi(
              savedQuotas.paidMembershipExpressQuotas ?? nextQuotas,
            ),
          );
          setAppliedPreset(id);
          try {
            sessionStorage.setItem('paidMembership.appliedPreset', id);
          } catch {
            /* ignore */
          }
          setMsg(t('paidMembership.preset.applyDone', { id }));
        } catch (e) {
          setMsg(e instanceof Error ? e.message : t('hq.saveFailed'));
        } finally {
          setApplyingPreset(null);
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

  const busy = applyingPreset != null;

  return (
    <div className="space-y-6">
      {doubleConfirmDialog}
      <PaidMembershipPresetPanel
        applying={applyingPreset}
        appliedId={appliedPreset}
        onApply={applyPreset}
      />
      <section className="space-y-3">
        <PaidMembershipExpressQuotasEditor
          value={expressQuotas}
          onChange={(next) => {
            setExpressQuotas(next);
            setAppliedPreset(
              detectAppliedPaidMembershipPreset({
                products,
                expressQuotas: next,
                memberGrade,
              }),
            );
          }}
        />
        <button
          type="button"
          className="pg-btn pg-btn-primary text-xs"
          disabled={savingQuotas || busy}
          onClick={saveQuotas}
        >
          {savingQuotas ? t('hq.saving') : t('paidMembership.quota.save')}
        </button>
      </section>
      <section className="space-y-3">
        <MemberGradePolicyEditor
          value={memberGrade}
          onChange={(next) => {
            setMemberGrade(next);
            setAppliedPreset(
              detectAppliedPaidMembershipPreset({
                products,
                expressQuotas,
                memberGrade: next,
              }),
            );
          }}
        />
        <p className="pg-hint text-xs">{t('paidMembership.hq.expressDesc')}</p>
        <button
          type="button"
          className="pg-btn pg-btn-primary text-xs"
          disabled={savingGrade || busy}
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
          disabled={savingLimits || busy}
          onClick={saveLimits}
        >
          {savingLimits ? t('hq.saving') : t('paidMembership.saveLimits')}
        </button>
      </section>
      {msg && (
        <p className="pg-hint">{msg}</p>
      )}
    </div>
  );
}
