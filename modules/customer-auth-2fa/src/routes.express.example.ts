/**
 * Express route wiring example — copy into host auth router.
 *
 * Assumes:
 * - authenticate middleware sets req.user.id
 * - verifyOtpLoginToken(otpToken) → { sub: userId }
 * - issueSession(userId) → { token, user }
 * - mapError(CustomerAuth2faError) → HTTP JSON
 */

/*
import { Router } from 'express';
import { createWebAuthnService, createLoginQrService, CustomerAuth2faError } from './index.js';
import { createPrismaAdapters } from './adapters.prisma.example.js';

export function mountCustomerAuth2fa(router: Router, deps: {
  prisma: any;
  authenticate: any;
  asyncHandler: any;
  verifyOtpLoginToken: (t: string) => { sub: string };
  issueSession: (userId: string) => Promise<unknown>;
}) {
  const adapters = createPrismaAdapters(deps.prisma);
  const webauthn = createWebAuthnService(adapters);
  const loginQr = createLoginQrService(adapters);

  router.post('/webauthn/register/options', deps.authenticate, deps.asyncHandler(async (req, res) => {
    res.json(await webauthn.beginRegistration(req.user.id));
  }));

  router.post('/webauthn/register/verify', deps.authenticate, deps.asyncHandler(async (req, res) => {
    await webauthn.finishRegistration(req.user.id, req.body.response, req.body.deviceLabel);
    res.json({ ok: true, credentials: await webauthn.listCredentials(req.user.id) });
  }));

  router.get('/webauthn/credentials', deps.authenticate, deps.asyncHandler(async (req, res) => {
    const eligible = await adapters.isIndividualEligible(req.user.id);
    if (!eligible) return res.json({ eligible: false, credentials: [] });
    res.json({ eligible: true, credentials: await webauthn.listCredentials(req.user.id) });
  }));

  router.delete('/webauthn/credentials/:id', deps.authenticate, deps.asyncHandler(async (req, res) => {
    await webauthn.deleteCredential(req.user.id, req.params.id);
    res.json({ ok: true, credentials: await webauthn.listCredentials(req.user.id) });
  }));

  router.post('/webauthn/login/options', deps.asyncHandler(async (req, res) => {
    const { sub } = deps.verifyOtpLoginToken(req.body.otpToken);
    res.json(await webauthn.beginAuthentication(sub));
  }));

  router.post('/webauthn/login/verify', deps.asyncHandler(async (req, res) => {
    const { sub } = deps.verifyOtpLoginToken(req.body.otpToken);
    await webauthn.finishAuthentication(sub, req.body.response);
    res.json(await deps.issueSession(sub));
  }));

  router.post('/qr/create', deps.asyncHandler(async (req, res) => {
    const { sub } = deps.verifyOtpLoginToken(req.body.otpToken);
    res.json(await loginQr.createBound(sub));
  }));

  router.post('/qr/create-anonymous', deps.asyncHandler(async (_req, res) => {
    res.json(await loginQr.createAnonymous());
  }));

  router.get('/qr/status', deps.asyncHandler(async (req, res) => {
    res.json(await loginQr.getStatus(String(req.query.ticket || '')));
  }));

  router.get('/qr/info', deps.asyncHandler(async (req, res) => {
    res.json(await loginQr.getInfo(String(req.query.ticket || '')));
  }));

  router.post('/qr/approve', deps.authenticate, deps.asyncHandler(async (req, res) => {
    await loginQr.approve(req.body.ticket, req.user.id);
    res.json({ ok: true });
  }));

  router.post('/qr/exchange', deps.asyncHandler(async (req, res) => {
    const userId = await loginQr.consumeApproved(req.body.ticket);
    res.json(await deps.issueSession(userId));
  }));
}
*/
