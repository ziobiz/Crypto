'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import {
  api,
  ApiError,
  type CustomerAccountProfile,
  type WebAuthnCredentialRow,
} from '@/lib/api';
import { ContentCard } from '@/components/layout/ContentCard';
import { OtpCodeInput } from '@/components/OtpCodeInput';
import { displayWalletTitle } from '@/lib/wallet-label';
import {
  clearStoredDeviceCredentialId,
  currentWebauthnDeviceLabel,
  findThisDeviceCredential,
  setStoredDeviceCredentialId,
} from '@/lib/webauthn-device';

export default function AccountPage() {
  const t = useT();
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<CustomerAccountProfile | null>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bioEligible, setBioEligible] = useState(false);
  const [bioCreds, setBioCreds] = useState<WebAuthnCredentialRow[]>([]);
  const [bioBusy, setBioBusy] = useState(false);
  const [thisDeviceRegistered, setThisDeviceRegistered] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteOtp, setDeleteOtp] = useState('');

  const syncThisDevice = (userId: string, credentials: WebAuthnCredentialRow[]) => {
    const mine = findThisDeviceCredential(userId, credentials);
    setThisDeviceRegistered(Boolean(mine));
  };

  const loadBio = async () => {
    try {
      const res = await api.webauthnCredentials();
      setBioEligible(res.eligible);
      setBioCreds(res.credentials);
      if (user?.id) syncThisDevice(user.id, res.credentials);
    } catch {
      setBioEligible(false);
      setBioCreds([]);
      setThisDeviceRegistered(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'CUSTOMER' && user.role !== 'CUSTOMER_OPERATOR') {
      router.replace('/dashboard');
      return;
    }
    setLoading(true);
    Promise.all([api.account.get(), loadBio()])
      .then(([p]) => {
        setProfile(p);
        setNickname(p.name);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : t('account.loadFailed')))
      .finally(() => setLoading(false));
  }, [user, router, t]);

  async function saveNickname(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    const next = nickname.trim();
    if (!next) {
      setErr(t('account.nicknameRequired'));
      return;
    }
    setSavingName(true);
    try {
      const res = await api.account.updateNickname(next);
      setNickname(res.name);
      setProfile((p) => (p ? { ...p, name: res.name } : p));
      await refresh();
      setMsg(t('account.nicknameSaved'));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('common.saveFailed'));
    } finally {
      setSavingName(false);
    }
  }

  async function registerBio() {
    if (!user?.id || bioCreds.length > 0 || thisDeviceRegistered) return;
    setErr('');
    setMsg('');
    setBioBusy(true);
    try {
      const options = await api.webauthnRegisterOptions();
      const att = await startRegistration({ optionsJSON: options as never });
      const label = currentWebauthnDeviceLabel();
      const res = await api.webauthnRegisterVerify(att, label || undefined);
      setBioCreds(res.credentials);
      const mine =
        findThisDeviceCredential(user.id, res.credentials) ||
        res.credentials.find((c) => c.deviceLabel === label) ||
        res.credentials[0];
      if (mine) {
        setStoredDeviceCredentialId(user.id, mine.id);
        setThisDeviceRegistered(true);
      }
      setMsg(t('account.bioRegistered'));
    } catch (e) {
      if (e instanceof ApiError && e.code === 'WEBAUTHN_LIMIT') {
        setErr(t('account.bioLimitOne'));
        void loadBio();
      } else {
        setErr(t('account.bioFailed'));
      }
    } finally {
      setBioBusy(false);
    }
  }

  function startDeleteBio(id: string) {
    setErr('');
    setMsg('');
    setDeleteTargetId(id);
    setDeleteOtp('');
  }

  async function confirmDeleteBio(code: string) {
    if (!user?.id || !deleteTargetId || code.length < 6) return;
    setErr('');
    setMsg('');
    setBioBusy(true);
    try {
      const res = await api.webauthnDeleteCredential(deleteTargetId, code);
      setBioCreds(res.credentials);
      clearStoredDeviceCredentialId(user.id);
      setThisDeviceRegistered(false);
      setDeleteTargetId(null);
      setDeleteOtp('');
      setMsg(t('account.bioDeleted'));
    } catch (e) {
      if (e instanceof ApiError && (e.code === 'INVALID_OTP_CODE' || e.code === 'INVALID_OTP')) {
        setErr(t('auth.otpInvalid'));
      } else {
        setErr(e instanceof ApiError ? e.message : t('account.bioFailed'));
      }
      setDeleteOtp('');
    } finally {
      setBioBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (newPassword.length < 8) {
      setErr(t('account.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr(t('account.passwordMismatch'));
      return;
    }
    setSavingPw(true);
    try {
      await api.account.changePassword(currentPassword, newPassword, confirmPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg(t('account.passwordChanged'));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('account.passwordChangeFailed'));
    } finally {
      setSavingPw(false);
    }
  }

  if (loading) {
    return <p className="pg-hint">{t('common.loading')}</p>;
  }
  if (!profile) {
    return <p className="text-sm text-red-600">{err || t('account.loadFailed')}</p>;
  }

  const phoneDisplay = [profile.phoneCountryCode, profile.phone].filter(Boolean).join(' ').trim();
  const customerTypeLabel =
    profile.customerType === 'CORPORATE' ? t('auth.corporate') : t('auth.individual');
  const limitCountryLabel = profile.limitCountry
    ? t(`auth.limitCountry.${profile.limitCountry}` as 'auth.limitCountry.JP')
    : t('account.notSet');
  const kycLabel =
    profile.kycStatus === 'APPROVED'
      ? t('kyc.status.APPROVED')
      : profile.kycStatus === 'PENDING'
        ? t('kyc.status.PENDING')
        : profile.kycStatus === 'REJECTED'
          ? t('kyc.status.REJECTED')
          : t('kyc.status.NOT_SUBMITTED');
  const approvalLabel =
    profile.approvalStatus === 'APPROVED'
      ? t('customers.approval.APPROVED')
      : profile.approvalStatus === 'REJECTED'
        ? t('customers.approval.REJECTED')
        : profile.approvalStatus === 'PENDING'
          ? t('customers.approval.PENDING')
          : t('account.notSet');

  const profileRows: { label: string; value: string }[] = [
    { label: t('auth.email'), value: profile.email },
    { label: t('auth.legalFirstName'), value: profile.legalFirstName ?? '' },
    { label: t('auth.legalLastName'), value: profile.legalLastName ?? '' },
    { label: t('auth.phone'), value: phoneDisplay },
    { label: t('auth.limitCountry'), value: limitCountryLabel },
    { label: t('auth.customerType'), value: customerTypeLabel },
    ...(profile.businessName
      ? [{ label: t('auth.businessName'), value: profile.businessName }]
      : []),
    { label: t('customers.col.kyc'), value: kycLabel },
    { label: t('customers.col.approval'), value: approvalLabel },
    ...(profile.recruitingOrg
      ? [
          {
            label: t('account.recruitingOrg'),
            value: `${profile.recruitingOrg.name} (${profile.recruitingOrg.code})`,
          },
        ]
      : []),
    {
      label: t('account.otpStatus'),
      value: profile.totpEnabled ? t('account.otpEnabled') : t('account.otpDisabled'),
    },
  ];

  return (
    <div className="pg-stack max-w-3xl">
      <p className="pg-hint">{t('account.pageHint')}</p>
      {(msg || err) && (
        <p className={`text-sm ${err ? 'text-red-600' : 'text-emerald-700'}`}>{err || msg}</p>
      )}

      <ContentCard>
        <h2 className="text-sm font-semibold text-teal-800">{t('nav.account')}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{t('account.section.profileHint')}</p>
        <form onSubmit={saveNickname} className="mt-4 space-y-4">
          <div>
            <label className="pg-label">{t('auth.nickname')}</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                className="pg-input min-w-[12rem] flex-1"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={80}
                required
              />
              <button
                type="submit"
                className="pg-btn pg-btn-secondary"
                disabled={savingName || nickname.trim() === profile.name}
              >
                {savingName ? t('common.saving') : t('account.saveNickname')}
              </button>
            </div>
          </div>
        </form>
        <div className="pg-table-wrap mt-5 overflow-x-auto">
          <table className="pg-table">
            <tbody>
              {profileRows.map((row) => (
                <tr key={row.label}>
                  <td className="w-[11rem] whitespace-nowrap !text-left font-medium text-slate-600">
                    {row.label}
                  </td>
                  <td className="break-all !text-left font-medium text-slate-900">
                    {row.value || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-amber-800/90">{t('account.legalNameReadonly')}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{t('account.otpReadonly')}</p>
      </ContentCard>

      {profile.customerType === 'INDIVIDUAL' && (
        <ContentCard>
          <h2 className="text-sm font-semibold text-slate-900">{t('account.bioTitle')}</h2>
          <p className="mt-1 text-[11px] text-slate-500">{t('account.bioHint')}</p>
          {!bioEligible ? (
            <p className="mt-3 text-sm text-slate-600">{t('account.bioNotEligible')}</p>
          ) : (
            <>
              <p className="mt-2 text-[11px] text-slate-500">{t('account.bioLimitOne')}</p>
              {bioCreds.length > 0 ? (
                <p className="mt-4 inline-flex rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-500">
                  {t('account.bioRegisterDone')}
                </p>
              ) : (
                <button
                  type="button"
                  className="pg-btn pg-btn-primary mt-4"
                  disabled={bioBusy}
                  onClick={() => void registerBio()}
                >
                  {bioBusy ? t('account.bioRegistering') : t('account.bioRegister')}
                </button>
              )}
              {bioCreds.length === 0 ? (
                <p className="mt-3 pg-hint">{t('account.bioNone')}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {bioCreds.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {c.deviceLabel || c.deviceType || c.id.slice(0, 8)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(c.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {deleteTargetId !== c.id && (
                          <button
                            type="button"
                            className="pg-btn pg-btn-secondary text-xs"
                            disabled={bioBusy}
                            onClick={() => startDeleteBio(c.id)}
                          >
                            {t('account.bioDelete')}
                          </button>
                        )}
                      </div>
                      {deleteTargetId === c.id && (
                        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                          <p className="text-xs text-slate-600">{t('account.bioDeleteOtpHint')}</p>
                          <OtpCodeInput
                            value={deleteOtp}
                            onChange={setDeleteOtp}
                            onComplete={(code) => void confirmDeleteBio(code)}
                            disabled={bioBusy}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="pg-btn pg-btn-primary text-xs"
                              disabled={bioBusy || deleteOtp.length < 6}
                              onClick={() => void confirmDeleteBio(deleteOtp)}
                            >
                              {bioBusy ? t('auth.otpVerifying') : t('account.bioDeleteConfirmOtp')}
                            </button>
                            <button
                              type="button"
                              className="pg-btn pg-btn-secondary text-xs"
                              disabled={bioBusy}
                              onClick={() => {
                                setDeleteTargetId(null);
                                setDeleteOtp('');
                              }}
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </ContentCard>
      )}

      <ContentCard>
        <h2 className="text-sm font-semibold text-slate-900">{t('account.section.password')}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{t('account.section.passwordHint')}</p>
        <form onSubmit={savePassword} className="mt-4 space-y-3 max-w-md">
          <div>
            <label className="pg-label">{t('account.currentPassword')}</label>
            <input
              type="password"
              autoComplete="current-password"
              className="pg-input mt-1 w-full"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="pg-label">{t('account.newPassword')}</label>
            <input
              type="password"
              autoComplete="new-password"
              className="pg-input mt-1 w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="pg-label">{t('account.confirmPassword')}</label>
            <input
              type="password"
              autoComplete="new-password"
              className="pg-input mt-1 w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="pg-btn pg-btn-primary" disabled={savingPw}>
            {savingPw ? t('common.saving') : t('account.changePassword')}
          </button>
        </form>
      </ContentCard>

      <ContentCard>
        <h2 className="text-sm font-semibold text-slate-900">{t('account.section.banks')}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{t('account.section.banksHint')}</p>
        {profile.bankAccounts.length === 0 ? (
          <p className="mt-3 pg-hint">{t('account.noBanks')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {profile.bankAccounts.map((b) => (
              <li
                key={b.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <p className="font-medium text-slate-900">
                  {b.currency} · {b.bankName}
                  {b.isDefault ? (
                    <span className="ml-2 text-[10px] font-semibold text-sky-700">
                      {t('account.default')}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 font-mono text-xs text-slate-700">{b.accountNumber}</p>
                <p className="text-xs text-slate-600">
                  {b.accountHolder}
                  {b.branchName ? ` · ${b.branchName}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ContentCard>

      <ContentCard>
        <h2 className="text-sm font-semibold text-slate-900">{t('account.section.wallets')}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{t('account.section.walletsHint')}</p>
        {profile.wallets.length === 0 ? (
          <p className="mt-3 pg-hint">{t('account.noWallets')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {profile.wallets.map((w) => (
              <li
                key={w.id}
                className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <p className="font-medium text-slate-900">
                  {displayWalletTitle(w, t)}
                  {w.isDefault ? (
                    <span className="ml-2 text-[10px] font-semibold text-sky-700">
                      {t('account.default')}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 break-all font-mono text-xs text-slate-700">{w.address}</p>
              </li>
            ))}
          </ul>
        )}
        {user?.role === 'CUSTOMER' ? (
          <p className="mt-2 text-[11px] text-slate-500">
            <a href="/dashboard/wallets" className="pg-link">
              {t('account.manageWallets')}
            </a>
          </p>
        ) : null}
      </ContentCard>
    </div>
  );
}
