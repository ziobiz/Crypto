import { Router } from 'express';
import path from 'path';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { assertTicketAccess } from '../services/ticket-access.service';
import { getAttachmentPath } from '../services/attachment.service';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

const router = Router();

router.get(
  '/:id/file',
  authenticate,
  asyncHandler(async (req, res) => {
    const attachment = await prisma.attachment.findUnique({
      where: { id: req.params.id },
    });

    if (!attachment) {
      throw new AppError(404, 'Attachment not found', 'NOT_FOUND');
    }

    await assertTicketAccess(req.user!, attachment.ticketId);

    const filePath = path.resolve(getAttachmentPath(attachment.storageKey));
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
    );
    res.sendFile(filePath);
  }),
);

export default router;
