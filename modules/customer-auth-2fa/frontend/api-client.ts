/**
 * Merge these methods into the host API client.
 * `request` must attach Bearer token when available and parse JSON errors.
 */

import type { QrTicketCreate, WebAuthnCredentialListItem } from './types.js';

export type CustomerAuth2faApi = {
  webauthnRegisterOptions: () => Promise<Record<string, unknown>>;
  webauthnRegisterVerify: (
    response: unknown,
    deviceLabel?: string,
  ) => Promise<{ ok: boolean; credentials: WebAuthnCredentialListItem[] }>;
  webauthnCredentials: () => Promise<{
    eligible: boolean;
    credentials: WebAuthnCredentialListItem[];
  }>;
  webauthnDeleteCredential: (
    id: string,
    code: string,
  ) => Promise<{ ok: boolean; credentials: WebAuthnCredentialListItem[] }>;
  webauthnLoginOptions: (otpToken: string) => Promise<Record<string, unknown>>;
  webauthnLoginVerify: (
    otpToken: string,
    response: unknown,
  ) => Promise<{ token: string; user: unknown }>;
  qrCreate: (otpToken: string) => Promise<QrTicketCreate>;
  qrCreateAnonymous: () => Promise<QrTicketCreate>;
  qrStatus: (ticket: string) => Promise<{ status: string; expiresAt: string }>;
  qrInfo: (ticket: string) => Promise<{ status: string; expiresAt: string; boundUser: boolean }>;
  qrApprove: (ticket: string) => Promise<{ ok: boolean }>;
  qrExchange: (ticket: string) => Promise<{ token: string; user: unknown }>;
};

type RequestFn = <T>(path: string, init?: RequestInit) => Promise<T>;

export function createCustomerAuth2faApi(request: RequestFn): CustomerAuth2faApi {
  return {
    webauthnRegisterOptions: () =>
      request('/api/auth/webauthn/register/options', { method: 'POST', body: '{}' }),
    webauthnRegisterVerify: (response, deviceLabel) =>
      request('/api/auth/webauthn/register/verify', {
        method: 'POST',
        body: JSON.stringify({ response, deviceLabel }),
      }),
    webauthnCredentials: () => request('/api/auth/webauthn/credentials'),
    webauthnDeleteCredential: (id, code) =>
      request(`/api/auth/webauthn/credentials/${encodeURIComponent(id)}/delete`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    webauthnLoginOptions: (otpToken) =>
      request('/api/auth/webauthn/login/options', {
        method: 'POST',
        body: JSON.stringify({ otpToken }),
      }),
    webauthnLoginVerify: (otpToken, response) =>
      request('/api/auth/webauthn/login/verify', {
        method: 'POST',
        body: JSON.stringify({ otpToken, response }),
      }),
    qrCreate: (otpToken) =>
      request('/api/auth/qr/create', {
        method: 'POST',
        body: JSON.stringify({ otpToken }),
      }),
    qrCreateAnonymous: () =>
      request('/api/auth/qr/create-anonymous', { method: 'POST', body: '{}' }),
    qrStatus: (ticket) =>
      request(`/api/auth/qr/status?ticket=${encodeURIComponent(ticket)}`),
    qrInfo: (ticket) =>
      request(`/api/auth/qr/info?ticket=${encodeURIComponent(ticket)}`),
    qrApprove: (ticket) =>
      request('/api/auth/qr/approve', {
        method: 'POST',
        body: JSON.stringify({ ticket }),
      }),
    qrExchange: (ticket) =>
      request('/api/auth/qr/exchange', {
        method: 'POST',
        body: JSON.stringify({ ticket }),
      }),
  };
}
