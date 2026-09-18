from pathlib import Path

p = Path(r"d:\Delopment\Crypto\backend\src\routes\trade-escrow.routes.ts")
raw = p.read_bytes()
mb = b"router.post('/:id/seller-accept'"
bidx = raw.index(mb)
nl1 = raw.rfind(b"\n", 0, bidx - 1)
nl0 = raw.rfind(b"\n", 0, nl1) + 1
new_tail = """// aliases
router.post('/:id/seller-accept', requireRoles(UserRole.CUSTOMER, UserRole.CUSTOMER_OPERATOR), requireSensitiveOtp, asyncHandler(async (req, res) => {
  const ticket = await acceptEscrowParty(req.user!, req.params.id, { disclaimerAccepted: true });
  await recordMerchantOperation({
    actorId: req.user!.id,
    merchantAdminUserId: merchantScopeUserId(req.user!),
    action: 'ESCROW_ACCEPT',
    entityType: 'EscrowTicket',
    entityId: ticket.id,
    summary: `Escrow accept ${ticket.ticketNo ?? ticket.id}`,
    after: { status: ticket.status },
    otpVerified: true,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  });
  res.json(ticket);
}));
router.post('/:id/seller-reject', requireRoles(UserRole.CUSTOMER, UserRole.CUSTOMER_OPERATOR), requireSensitiveOtp, asyncHandler(async (req, res) => {
  const reason = z.object({ reason: z.string().optional() }).parse(req.body).reason;
  const ticket = await rejectEscrowParty(req.user!, req.params.id, reason);
  await recordMerchantOperation({
    actorId: req.user!.id,
    merchantAdminUserId: merchantScopeUserId(req.user!),
    action: 'ESCROW_REJECT',
    entityType: 'EscrowTicket',
    entityId: ticket.id,
    summary: `Escrow reject ${ticket.ticketNo ?? ticket.id}`,
    after: { status: ticket.status, reason },
    otpVerified: true,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  });
  res.json(ticket);
}));
router.post('/:id/open-funding', asyncHandler(async (req, res) => {
  const ticket = await openEscrowDeposit(req.user!, req.params.id);
  res.json(ticket);
}));

export default router;
"""
prefix = raw[:nl0].decode("utf-8", errors="replace").encode("utf-8")
p.write_bytes(prefix + new_tail.encode("utf-8"))
# verify
p.read_text(encoding="utf-8")
print("ok")
